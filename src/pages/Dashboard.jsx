import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUserProfile, getTodaySession,
  getProgress, undoToday, getYesterdayWorkoutDone,
  markWorkoutComplete, savePhaseComplete, auth,
} from '../services/firebase';
import ExerciseInfo from '../components/ExerciseInfo';

const PHASE_COLORS = {
  warmup:   '#f59e0b',
  workout:  '#2563eb',
  recovery: '#84cc16',
};

const FINISH_REASONS = [
  'Got interrupted',
  'Too tired',
  'Ran out of time',
  'Completed enough for today',
  'Other',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Phase Card ───────────────────────────────────────────────

function PhaseCard({ title, color, exercises = [], duration, meta, done, durationTaken, onStart, locked, onExerciseTap }) {
  if (done) {
    return (
      <div style={styles.phaseDoneRow}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="8" fill={color} fillOpacity="0.15" />
          <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ ...styles.phaseDoneTitle, color }}>{title} Done</span>
        {durationTaken > 0 && (
          <span style={styles.phaseDoneTime}>{durationTaken} min</span>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...styles.phaseCard, borderTop: `3px solid ${color}` }}>

      {/* Card header */}
      <div style={styles.phaseCardTop}>
        <div style={styles.phaseCardLeft}>
          <div style={{ ...styles.phaseDot, background: color }} />
          <span style={styles.phaseTitle}>{title}</span>
        </div>
        <div style={styles.phaseBadges}>
          {duration != null && (
            <span style={styles.durationBadge}>{duration} min</span>
          )}
          {meta && (
            <span style={styles.metaBadge}>{meta}</span>
          )}
        </div>
      </div>

      {/* Exercise list */}
      <div style={styles.exerciseList}>
        {exercises.slice(0, 4).map((ex, i) => (
          <div key={i} style={styles.exerciseRow}>
            <div style={{ ...styles.exerciseDot, background: color }} />
            <button
              style={styles.exerciseNameBtn}
              onClick={() => ex.instructions && onExerciseTap?.(ex)}
              disabled={!ex.instructions}
            >
              {ex.name}
              {ex.instructions && (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginLeft: 4, flexShrink: 0 }}>
                  <circle cx="6.5" cy="6.5" r="5.5" stroke={color} strokeWidth="1.2"/>
                  <circle cx="6.5" cy="4.5" r="0.9" fill={color}/>
                  <path d="M6.5 6.5v3" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            <span style={styles.exerciseMeta}>
              {ex.type === 'timed'
                ? (ex.sets ? `${ex.sets}×${ex.duration}s` : `${ex.duration}s`)
                : `${ex.sets}×${ex.reps}`}
            </span>
          </div>
        ))}
        {exercises.length > 4 && (
          <p style={styles.moreText}>+{exercises.length - 4} more</p>
        )}
      </div>

      {/* Start button or locked state */}
      {locked ? (
        <div style={styles.lockedNote}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <rect x="3" y="6" width="8" height="6" rx="1.5" stroke="#9ca3af" strokeWidth="1.3" />
            <path d="M5 6V4.5a2 2 0 014 0V6" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span>Complete your warm up first</span>
        </div>
      ) : (
        <button
          className="btn-lime"
          style={{ marginTop: 16, width: '100%' }}
          onClick={onStart}
        >
          Start {title}
        </button>
      )}
    </div>
  );
}

// ─── Finish Early Modal ───────────────────────────────────────

function FinishEarlyModal({ onSelect, onClose }) {
  const [otherSelected, setOtherSelected] = useState(false);
  const [otherText, setOtherText] = useState('');

  const handleReasonClick = (reason) => {
    if (reason === 'Other') {
      setOtherSelected(true);
    } else {
      onSelect(reason);
    }
  };

  if (otherSelected) {
    return (
      <>
        <div style={styles.modalOverlay} onClick={onClose} />
        <div style={styles.modalSheet}>
          <div style={styles.modalHandle} />
          <h3 style={styles.modalTitle}>What's going on?</h3>
          <p style={styles.modalSubtitle}>Type your reason below.</p>
          <textarea
            style={styles.otherInput}
            placeholder="e.g. Had to leave for an appointment…"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            rows={3}
            autoFocus
          />
          <button
            style={styles.cancelBtn}
            onClick={() => onSelect(otherText.trim() || 'Other')}
          >
            Done
          </button>
          <button
            style={styles.backBtn}
            onClick={() => setOtherSelected(false)}
          >
            ← Back
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={styles.modalOverlay} onClick={onClose} />
      <div style={styles.modalSheet}>
        <div style={styles.modalHandle} />
        <h3 style={styles.modalTitle}>Why are you finishing now?</h3>
        <p style={styles.modalSubtitle}>You haven't completed all phases yet.</p>
        <div style={styles.reasonList}>
          {FINISH_REASONS.map(reason => (
            <button key={reason} style={styles.reasonBtn} onClick={() => handleReasonClick(reason)}>
              {reason}
            </button>
          ))}
        </div>
        <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
      </div>
    </>
  );
}

// ─── Completed Card ───────────────────────────────────────────

function CompletedCard({ name, onUndo, undoing, onChat }) {
  return (
    <div style={styles.completedCard}>
      <div style={styles.completedIconWrap}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" fill="#f0fdf4" stroke="#84cc16" strokeWidth="2" />
          <path d="M12 20l6 6 10-12" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 style={styles.completedTitle}>Great work today, {name || 'Div'}!</h3>
      <p style={styles.completedSubtitle}>All three phases complete. Your coach is proud.</p>
      <button style={styles.chatRestBtn} onClick={onChat}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 3V3z"
            stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        Chat with Coach
      </button>
      <button style={styles.undoBtn} onClick={onUndo} disabled={undoing}>
        {undoing ? 'Undoing…' : (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7a4 4 0 117 2.65" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M3 4.5v3h3" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Undo Today
          </>
        )}
      </button>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();

  const [profile, setProfile]   = useState(null);
  const [session, setSession]   = useState(null);
  const [phases, setPhases]     = useState({ warmup: false, workout: false, recovery: false });
  const [progress, setProgress] = useState({ streak: 0, total: 0 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [undoing, setUndoing]   = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null); // for ExerciseInfo sheet

  // Issue 2 fix: use auth displayName (real name for Google users) over stored profile name
  const userName  = auth.currentUser?.displayName || profile?.name || '';
  const today    = DAYS[new Date().getDay()];
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const isTrainingDay = (p) => {
    if (!p?.days) return true;
    return p.days.includes(today);
  };

  useEffect(() => {
    async function load() {
      try {
        const [p, prog] = await Promise.all([getUserProfile(), getProgress()]);
        setProfile(p);
        setProgress(prog || { streak: 0, total: 0 });

        if (!p) { setLoading(false); return; }

        const existing = await getTodaySession();
        if (existing) {
          setSession(existing);
          setPhases({
            warmup:   !!existing.warmupComplete,
            workout:  !!existing.workoutComplete,
            recovery: !!existing.recoveryComplete,
          });

          // Issue 3 fix: if all phases done but workout wasn't recorded, record it now
          const allPhasesComplete = !!existing.warmupComplete && !!existing.workoutComplete && !!existing.recoveryComplete;
          if (allPhasesComplete && !existing.workoutRecorded) {
            await markWorkoutComplete({
              muscleGroup: existing.muscleGroup || 'Full Body',
              exercises: existing.exercises || [],
            });
            const updatedProg = await getProgress();
            setProgress(updatedProg || { streak: 0, total: 0 });
          }

          setLoading(false);
          return;
        }

        // No session yet — redirect into setup flow
        if (isTrainingDay(p)) {
          const didYesterday = await getYesterdayWorkoutDone();
          navigate(didYesterday ? '/feeling' : '/setup', { replace: true });
          return;
        }

        setLoading(false); // rest day
      } catch (e) {
        console.error(e);
        setError('Could not load your session. Try again.');
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleStartPhase = (mode) => {
    navigate(`/workout/${mode}`);
  };

  const allDone = phases.warmup && phases.workout && phases.recovery;

  const handleFinishDay = () => {
    if (allDone) {
      navigate('/complete');
    } else {
      setShowFinishModal(true);
    }
  };

  const handleFinishWithReason = async (reason) => {
    setShowFinishModal(false);
    try {
      // Mark any incomplete phases as done
      const ops = [];
      if (!phases.warmup)   ops.push(savePhaseComplete('warmup', 0));
      if (!phases.workout)  ops.push(savePhaseComplete('workout', 0));
      if (!phases.recovery) ops.push(savePhaseComplete('recovery', 0));
      await Promise.all(ops);

      // Record the workout (idempotent — won't double-count)
      await markWorkoutComplete({
        muscleGroup: session?.muscleGroup || 'Full Body',
        exercises: session?.exercises || [],
      });

      // Update local state — shows CompletedCard on dashboard
      setPhases({ warmup: true, workout: true, recovery: true });

      // Refresh progress stats
      const prog = await getProgress();
      setProgress(prog || { streak: 0, total: 0 });
    } catch (e) {
      console.error(e);
      setError('Could not finish day. Try again.');
    }
  };

  const handleUndo = async () => {
    if (undoing) return;
    setUndoing(true);
    setError('');
    try {
      await undoToday();
      navigate('/feeling', { replace: true });
    } catch (e) {
      console.error(e);
      setError('Could not undo. Try again.');
      setUndoing(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.centred}>
        <div style={styles.spinner} />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.greetingText}>{greeting}</p>
          <h1 style={styles.name}>{userName}</h1>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.chatBtn} onClick={() => navigate('/chat')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v9a1 1 0 01-1 1H6l-4 3V4z"
                stroke="#2563eb" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <span style={styles.chatBtnLabel}>Coach</span>
          </button>
          <div style={styles.avatar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#2563eb" strokeWidth="1.6" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginBottom: 4 }}>
            <path d="M9 2C9 2 4 6 4 10a5 5 0 0010 0c0-4-5-8-5-8z"
              stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <span style={styles.statNum}>{progress.streak}</span>
          <span style={styles.statLabel}>Streak</span>
        </div>
        <div style={styles.statCard}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginBottom: 4 }}>
            <circle cx="9" cy="9" r="7" stroke="#84cc16" strokeWidth="1.5" />
            <path d="M6 9l2 2 4-4" stroke="#84cc16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={styles.statNum}>{progress.total}</span>
          <span style={styles.statLabel}>Done</span>
        </div>
        <div style={styles.statCard}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginBottom: 4 }}>
            <rect x="2" y="3" width="14" height="13" rx="2" stroke="#2563eb" strokeWidth="1.5" />
            <path d="M6 1v4M12 1v4M2 8h14" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={styles.statNum}>{profile?.days?.length || '—'}</span>
          <span style={styles.statLabel}>Days/wk</span>
        </div>
      </div>

      {/* Today's section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Today · {today}</h2>

        {/* Error */}
        {error && (
          <div style={styles.errorCard}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {/* Rest day */}
        {!session && isTrainingDay(profile) === false && (
          <div style={styles.restCard}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#e5e7eb" strokeWidth="2" />
              <path d="M14 20h12M14 26h8" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3 style={styles.restTitle}>Rest Day</h3>
            <p style={styles.restSubtitle}>Recovery is part of the plan. See you tomorrow.</p>
            <button style={styles.chatRestBtn} onClick={() => navigate('/chat')}>
              Chat with Coach
            </button>
          </div>
        )}

        {/* Session — completed state */}
        {session && allDone && (
          <CompletedCard
            name={userName}
            onUndo={handleUndo}
            undoing={undoing}
            onChat={() => navigate('/chat')}
          />
        )}

        {/* Session — 3-card layout (in progress) */}
        {session && !allDone && (
          <>
            {/* Coach note */}
            {session.coachNote && (
              <div style={styles.coachNote}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="7" cy="7" r="6" stroke="#2563eb" strokeWidth="1.2" />
                  <circle cx="7" cy="5" r="1.2" fill="#2563eb" />
                  <path d="M7 8v3" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <p style={styles.coachNoteText}>{session.coachNote}</p>
              </div>
            )}

            {/* Warmup Card */}
            <PhaseCard
              title="Warm Up"
              color={PHASE_COLORS.warmup}
              exercises={session.warmup || []}
              duration={session.setupChoices?.warmupDuration}
              done={phases.warmup}
              durationTaken={session.phasesDuration?.warmup}
              onStart={() => handleStartPhase('warmup')}
              locked={false}
              onExerciseTap={setSelectedExercise}
            />

            {/* Workout Card */}
            <PhaseCard
              title="Main Workout"
              color={PHASE_COLORS.workout}
              exercises={session.exercises || []}
              duration={session.setupChoices?.workoutDuration}
              meta={session.muscleGroup}
              done={phases.workout}
              durationTaken={session.phasesDuration?.workout}
              onStart={() => handleStartPhase('workout')}
              locked={!phases.warmup}
              onExerciseTap={setSelectedExercise}
            />

            {/* Recovery Card */}
            <PhaseCard
              title="Recovery"
              color={PHASE_COLORS.recovery}
              exercises={session.recovery || []}
              duration={session.setupChoices?.recoveryDuration}
              meta={session.setupChoices?.recoveryType}
              done={phases.recovery}
              durationTaken={session.phasesDuration?.recovery}
              onStart={() => handleStartPhase('recovery')}
              locked={false}
              onExerciseTap={setSelectedExercise}
            />

            {/* Finish Day */}
            <button
              style={{
                ...styles.finishBtn,
                ...(allDone
                  ? { background: '#84cc16', color: 'white', border: 'none' }
                  : { background: 'transparent', color: '#6b7280', border: '1.5px solid #e5e7eb' }),
              }}
              onClick={handleFinishDay}
            >
              {allDone ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3.5 9.5l4 4 7-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Finish Day
                </>
              ) : (
                'Finish Early'
              )}
            </button>

            {/* Undo Today */}
            <button style={styles.undoBtn} onClick={handleUndo} disabled={undoing}>
              {undoing ? (
                'Undoing…'
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7a4 4 0 117 2.65" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M3 4.5v3h3" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Undo Today
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Quick links */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Access</h2>
        <div style={styles.quickLinks}>
          <button style={styles.quickBtn} onClick={() => navigate('/progress')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 20V14M9 20V10M14 20V6M19 20V2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={styles.quickLabel}>Progress</span>
          </button>
          <button style={styles.quickBtn} onClick={() => navigate('/chat')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v12H6l-4 4V4z" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span style={styles.quickLabel}>Ask Coach</span>
          </button>
        </div>
      </div>

      {/* Finish Early Modal */}
      {showFinishModal && (
        <FinishEarlyModal
          onSelect={handleFinishWithReason}
          onClose={() => setShowFinishModal(false)}
        />
      )}

      {/* Exercise Info Sheet */}
      {selectedExercise && (
        <ExerciseInfo
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = {
  page:            { padding: '0 0 100px', background: 'var(--bg)', minHeight: '100vh' },
  centred:         { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner:         { width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #84cc16', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  // Header
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '56px 20px 20px' },
  greetingText:    { fontSize: 14, color: 'var(--gray)', fontWeight: 500, marginBottom: 2 },
  name:            { fontSize: 32, fontWeight: 900, color: 'var(--black)', letterSpacing: '-0.5px' },
  headerRight:     { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 },
  chatBtn:         { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 24, cursor: 'pointer', fontFamily: 'inherit' },
  chatBtnLabel:    { fontSize: 13, fontWeight: 700, color: '#2563eb' },
  avatar:          { width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Stats
  statsRow:        { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '0 20px 24px' },
  statCard:        { background: 'var(--white)', borderRadius: 'var(--radius)', padding: '14px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'var(--shadow)' },
  statNum:         { fontSize: 22, fontWeight: 900, color: 'var(--black)', letterSpacing: '-0.3px', lineHeight: 1.1 },
  statLabel:       { fontSize: 10, fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 2 },

  // Section
  section:         { padding: '0 20px 24px' },
  sectionTitle:    { fontSize: 20, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.3px', marginBottom: 14 },

  // Coach note
  coachNote:       { display: 'flex', alignItems: 'flex-start', gap: 8, background: '#eff6ff', borderRadius: 10, padding: '10px 12px', marginBottom: 14 },
  coachNoteText:   { fontSize: 13, color: '#1d4ed8', fontWeight: 500, margin: 0, lineHeight: 1.5 },

  // Phase card
  phaseCard:       { background: 'var(--white)', borderRadius: 'var(--radius)', padding: 18, boxShadow: 'var(--shadow)', marginBottom: 14 },
  phaseCardTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  phaseCardLeft:   { display: 'flex', alignItems: 'center', gap: 8 },
  phaseDot:        { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  phaseTitle:      { fontSize: 16, fontWeight: 800, color: 'var(--black)' },
  phaseBadges:     { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
  durationBadge:   { fontSize: 12, fontWeight: 700, color: '#374151', background: '#f3f4f6', borderRadius: 20, padding: '3px 10px' },
  metaBadge:       { fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 20, padding: '3px 10px' },

  // Exercises inside card
  exerciseList:    { display: 'flex', flexDirection: 'column', gap: 0 },
  exerciseRow:     { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--gray-light)' },
  exerciseDot:     { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  // Exercise name is now a button
  exerciseNameBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    fontFamily: "'Figtree', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--black)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  exerciseMeta:    { fontSize: 13, color: 'var(--gray)', fontWeight: 600 },
  moreText:        { fontSize: 13, color: 'var(--blue)', fontWeight: 600, marginTop: 8 },

  // Locked note
  lockedNote:      { display: 'flex', alignItems: 'center', gap: 7, marginTop: 14, padding: '10px 14px', background: '#f9fafb', borderRadius: 10, fontSize: 13, fontWeight: 500, color: '#9ca3af' },

  // Done row (collapsed card)
  phaseDoneRow:    { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--white)', borderRadius: 'var(--radius)', padding: '16px 18px', boxShadow: 'var(--shadow)', marginBottom: 14 },
  phaseDoneTitle:  { flex: 1, fontSize: 15, fontWeight: 700 },
  phaseDoneTime:   { fontSize: 13, fontWeight: 600, color: 'var(--gray)' },

  // Completed card
  completedCard:   { background: 'var(--white)', borderRadius: 'var(--radius)', padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow)' },
  completedIconWrap: { marginBottom: 4 },
  completedTitle:  { fontSize: 22, fontWeight: 800, color: 'var(--black)', margin: 0, letterSpacing: '-0.3px' },
  completedSubtitle: { fontSize: 14, color: 'var(--gray)', fontWeight: 500, margin: '0 0 4px' },

  // Finish Day button
  finishBtn:       { width: '100%', padding: '16px', borderRadius: 14, fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.15s' },

  // Undo button
  undoBtn:         { marginTop: 10, width: '100%', padding: '12px', background: 'transparent', border: '1.5px solid #e5e7eb', borderRadius: 12, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },

  // Error
  errorCard:       { background: '#fff1f2', borderRadius: 'var(--radius)', padding: 16, marginBottom: 14 },
  errorText:       { fontSize: 14, color: '#ef4444', fontWeight: 500, margin: 0 },

  // Rest day
  restCard:        { background: 'var(--white)', borderRadius: 'var(--radius)', padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow)' },
  restTitle:       { fontSize: 20, fontWeight: 800, color: 'var(--black)', margin: 0 },
  restSubtitle:    { fontSize: 14, color: 'var(--gray)', fontWeight: 500, margin: 0 },
  chatRestBtn:     { marginTop: 8, padding: '10px 24px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 24, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },

  // Quick links
  quickLinks:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  quickBtn:        { background: 'var(--white)', border: 'none', borderRadius: 'var(--radius)', padding: '20px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow)' },
  quickLabel:      { fontSize: 14, fontWeight: 700, color: 'var(--black)' },

  // Finish early modal
  modalOverlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 },
  modalSheet:      { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', zIndex: 101 },
  modalHandle:     { width: 36, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 20px' },
  modalTitle:      { fontSize: 18, fontWeight: 800, color: 'var(--black)', margin: '0 0 4px' },
  modalSubtitle:   { fontSize: 14, color: 'var(--gray)', fontWeight: 500, margin: '0 0 20px' },
  reasonList:      { display: 'flex', flexDirection: 'column', gap: 10 },
  reasonBtn:       { width: '100%', padding: '14px 16px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: 'var(--black)', cursor: 'pointer', textAlign: 'left' },
  cancelBtn:       { marginTop: 14, width: '100%', padding: '14px', background: '#84cc16', border: 'none', borderRadius: 14, fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer' },
  backBtn:         { marginTop: 8, width: '100%', padding: '12px', background: 'transparent', border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--gray)', cursor: 'pointer' },
  otherInput:      { width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontFamily: 'inherit', fontSize: 15, color: 'var(--black)', resize: 'none', outline: 'none', marginBottom: 14, boxSizing: 'border-box', lineHeight: 1.5 },
};
