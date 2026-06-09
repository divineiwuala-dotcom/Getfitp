import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc, setDoc, getDoc, deleteDoc,
  collection, addDoc, getDocs,
  query, orderBy, limit,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ─── Dynamic USER_ID ──────────────────────────────────────────
// Replaces hardcoded 'div'. Throws clearly if called before login.

function getUserId() {
  const user = auth.currentUser;
  if (!user) throw new Error('getUserId: no logged-in user');
  return user.uid;
}

// ─── Auth Functions ───────────────────────────────────────────

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signUpWithEmail(email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─── Profile ──────────────────────────────────────────────────

export async function saveProfile(profile) {
  const uid = getUserId();
  await setDoc(doc(db, 'users', uid), profile);
}

export async function getUserProfile() {
  const uid = getUserId();
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// Legacy alias kept for compatibility
export const getProfile = getUserProfile;

// ─── Today's Session ──────────────────────────────────────────

export async function saveTodaySession(session) {
  const uid = getUserId();
  const today = new Date().toDateString();
  await setDoc(doc(db, 'sessions', uid), {
    ...session,
    generatedAt: new Date().toISOString(),
    forDate: today,
  });
}

export async function getTodaySession() {
  const uid = getUserId();
  const snap = await getDoc(doc(db, 'sessions', uid));
  if (!snap.exists()) return null;

  const data = snap.data();
  const today = new Date().toDateString();

  // Return null if session is from a different day
  if (data.forDate !== today) return null;

  return data;
}

// ─── Undo Today ───────────────────────────────────────────────

export async function undoToday() {
  const uid = getUserId();
  const today = new Date().toDateString();

  // 1. Find and delete today's history entry
  const historyRef = collection(db, 'users', uid, 'history');
  const q = query(historyRef, orderBy('date', 'desc'), limit(5));
  const snap = await getDocs(q);

  let deletedCalories = 0;
  for (const docSnap of snap.docs) {
    const entry = docSnap.data();
    const entryDate = new Date(entry.date).toDateString();
    if (entryDate === today) {
      deletedCalories = entry.caloriesBurned || 0;
      await deleteDoc(docSnap.ref);
      break;
    }
  }

  // 2. Clear today's generated session so app regenerates it
  await deleteDoc(doc(db, 'sessions', uid));

  // 3. Roll back progress (total count and calories)
  const progressSnap = await getDoc(doc(db, 'progress', uid));
  if (progressSnap.exists()) {
    const current = progressSnap.data();

    const lastDate = current.lastDate ? new Date(current.lastDate).toDateString() : null;
    const wasToday = lastDate === today;

    const remainingSnap = await getDocs(query(historyRef, orderBy('date', 'desc'), limit(1)));
    const prevEntry = remainingSnap.docs[0]?.data() || null;

    await setDoc(doc(db, 'progress', uid), {
      streak: wasToday ? Math.max(0, (current.streak || 1) - 1) : current.streak,
      total: Math.max(0, (current.total || 1) - 1),
      lastDate: prevEntry ? prevEntry.date : null,
      totalCalories: Math.max(0, (current.totalCalories || 0) - deletedCalories),
    });
  }
}

// ─── Workout History ──────────────────────────────────────────

export async function markWorkoutComplete(workoutInfo = {}) {
  const uid = getUserId();

  // Idempotency guard — prevents double-recording if called more than once
  const sessionSnap = await getDoc(doc(db, 'sessions', uid));
  if (sessionSnap.exists() && sessionSnap.data().workoutRecorded) return;

  const entry = {
    date: new Date().toISOString(),
    muscleGroup: workoutInfo.muscleGroup || 'Full Body',
    duration: workoutInfo.duration || 0,
    rating: workoutInfo.rating || null,
    caloriesBurned: workoutInfo.caloriesBurned || 0,
    exercises: workoutInfo.exercises || [],
  };

  await addDoc(collection(db, 'users', uid, 'history'), entry);
  await updateProgress(workoutInfo.caloriesBurned || 0);

  // Mark session as recorded so future calls are no-ops
  await setDoc(doc(db, 'sessions', uid), { workoutRecorded: true }, { merge: true });
}

export async function getRecentHistory(n = 3) {
  const uid = getUserId();
  const q = query(
    collection(db, 'users', uid, 'history'),
    orderBy('date', 'desc'),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// Legacy — returns last 20
export async function getWorkoutHistory() {
  const uid = getUserId();
  const q = query(
    collection(db, 'users', uid, 'history'),
    orderBy('date', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// ─── Exercise Ratings ─────────────────────────────────────────

export async function saveExerciseRatings(mode, ratings) {
  const uid = getUserId();
  const ratingMap = {};
  for (const r of ratings) {
    ratingMap[r.name] = r.difficulty;
  }
  await setDoc(
    doc(db, 'users', uid),
    { exerciseRatings: ratingMap },
    { merge: true }
  );
}

// ─── Progress ─────────────────────────────────────────────────

async function updateProgress(caloriesThisSession = 0) {
  const uid = getUserId();
  const progressSnap = await getDoc(doc(db, 'progress', uid));
  const current = progressSnap.exists()
    ? progressSnap.data()
    : { streak: 0, total: 0, lastDate: null, totalCalories: 0 };

  const today = new Date().toDateString();
  const lastDate = current.lastDate ? new Date(current.lastDate).toDateString() : null;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = current.streak;
  if (lastDate === today) {
    // Already logged today — don't increment streak
  } else if (lastDate === yesterday.toDateString()) {
    newStreak = current.streak + 1;
  } else {
    newStreak = 1;
  }

  await setDoc(doc(db, 'progress', uid), {
    streak: newStreak,
    total: (current.total || 0) + 1,
    lastDate: new Date().toISOString(),
    totalCalories: (current.totalCalories || 0) + caloriesThisSession,
  });
}

export async function getProgress() {
  const uid = getUserId();
  const snap = await getDoc(doc(db, 'progress', uid));
  return snap.exists()
    ? snap.data()
    : { streak: 0, total: 0, totalCalories: 0 };
}

// ─── Legacy plan functions (kept for safety) ──────────────────

export async function savePlan(plan) {
  const uid = getUserId();
  await setDoc(doc(db, 'plans', uid), {
    planName: plan.planName,
    createdAt: new Date().toISOString(),
    weekCount: plan.weeks?.length || 0,
  });
  for (const week of plan.weeks || []) {
    await setDoc(
      doc(db, 'plans', uid, 'weeks', `week_${week.weekNumber}`),
      week
    );
  }
}

export async function getPlan() {
  const uid = getUserId();
  const planSnap = await getDoc(doc(db, 'plans', uid));
  if (!planSnap.exists()) return null;
  const planMeta = planSnap.data();
  const weeks = [];
  for (let i = 1; i <= planMeta.weekCount; i++) {
    const weekSnap = await getDoc(doc(db, 'plans', uid, 'weeks', `week_${i}`));
    if (weekSnap.exists()) weeks.push(weekSnap.data());
  }
  return { ...planMeta, weeks };
}

// ─── Phase Status ─────────────────────────────────────────────

export async function getTodayPhaseStatus() {
  const session = await getTodaySession();
  if (!session) return { warmup: false, workout: false, recovery: false };
  return {
    warmup:   !!session.warmupComplete,
    workout:  !!session.workoutComplete,
    recovery: !!session.recoveryComplete,
  };
}

export async function savePhaseComplete(mode, durationMin) {
  const uid = getUserId();
  const key = mode === 'workout' ? 'workoutComplete'
            : mode === 'warmup'  ? 'warmupComplete'
            : 'recoveryComplete';
  await setDoc(
    doc(db, 'sessions', uid),
    { [key]: true, [`${mode}Duration`]: durationMin },
    { merge: true }
  );
}

export async function saveTodaySetup(sessionSetup) {
  const uid = getUserId();
  const today = new Date().toDateString();
  await setDoc(
    doc(db, 'sessions', uid),
    { setup: sessionSetup, forDate: today },
    { merge: true }
  );
}

export async function saveTodayFeeling(feeling) {
  const uid = getUserId();
  await setDoc(
    doc(db, 'sessions', uid),
    { feeling },
    { merge: true }
  );
}

export async function getYesterdayWorkoutDone() {
  const uid = getUserId();
  const historyRef = collection(db, 'users', uid, 'history');
  const q = query(historyRef, orderBy('date', 'desc'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return false;

  const lastEntry = snap.docs[0].data();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const lastDate = new Date(lastEntry.date).toDateString();
  return lastDate === yesterday.toDateString();
}
