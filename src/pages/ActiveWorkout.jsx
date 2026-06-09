import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTodaySession, savePhaseComplete, saveExerciseRatings } from '../services/firebase';
import ExerciseCard from '../components/ExerciseCard';

// Maps URL mode → session key + display config
const PHASE_CONFIG = {
  warmup:   { key: 'warmup',     label: 'Warm Up',      color: '#f59e0b' },
  workout:  { key: 'exercises',  label: 'Main Workout',  color: '#2563eb' },
  recovery: { key: 'recovery',   label: 'Recovery',      color: '#84cc16' },
};

// ─── Tooltip wrapper (instant, no delay) ─────────────────────
function Tooltip({ label, children }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(s => !s)}
    >
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 6,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(4px)',
          color: 'white',
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 8px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          fontFamily: "'Figtree', sans-serif",
          letterSpacing: '0.3px',
        }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Face icons — clean 0 0 24 24 viewBox ────────────────────
function HappyIcon({ active, size = 28 }) {
  const color = active ? '#84cc16' : 'rgba(255,255,255,0.22)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8.5"  cy="9.5" r="1.4" fill={color} />
      <circle cx="15.5" cy="9.5" r="1.4" fill={color} />
      <path d="M7 14.5a5 5 0 0 0 10 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NeutralIcon({ active, size = 28 }) {
  const color = active ? '#f59e0b' : 'rgba(255,255,255,0.22)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8.5"  cy="9.5" r="1.4" fill={color} />
      <circle cx="15.5" cy="9.5" r="1.4" fill={color} />
      <line x1="8" y1="15.5" x2="16" y2="15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SadIcon({ active, size = 28 }) {
  const color = active ? '#ef4444' : 'rgba(255,255,255,0.22)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8.5"  cy="9.5" r="1.4" fill={color} />
      <circle cx="15.5" cy="9.5" r="1.4" fill={color} />
      <path d="M7 17.5a5 5 0 0 1 10 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function ActiveWorkout() {
  const { mode } = useParams(); // "warmup" | "workout" | "recovery"
  const navigate = useNavigate();

  const phase = PHASE_CONFIG[mode] || PHASE_CONFIG.workout;

  const [exercises, setExercises]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [done, setDone]             = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [ratings, setRatings]       = useState({}); // { exerciseName: 'easy'|'moderate'|'hard' }
  const [saving, setSaving]         = useState(false);

  const startTimeRef = useRef(Date.now());

  // ─── Load only this phase's exercises ─────────────────────
  useEffect(() => {
    async function load() {
      try {
        const s = await getTodaySession();
        if (!s) { navigate('/dashboard'); return; }

        const normaliseRest = (ex) => ({
          ...ex,
          rest: typeof ex.rest === 'string' ? parseInt(ex.rest) || 30 : ex.rest ?? 30,
          sets: ex.sets ?? 1,
        });

        const isTimedPhase = mode === 'warmup' || mode === 'recovery';

        const raw = (s[phase.key] || []).map((ex) => ({
          ...normaliseRest(ex),
          ...(isTimedPhase ? { type: 'timed', sets: 1 } : {}),
        }));

        setExercises(raw);
        startTimeRef.current = Date.now();
      } catch (e) {
        console.error(e);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mode]);

  // ─── Called when ExerciseCard finishes all exercises ──────
  const handlePhaseComplete = async () => {
    const durationMin = Math.round((Date.now() - startTimeRef.current) / 60000);
    try {
      await savePhaseComplete(mode, durationMin);
    } catch (e) {
      console.error('Failed to save phase:', e);
    }
    setTransitioning(true);
    setTimeout(() => {
      setDone(true);
      setTransitioning(false);
    }, 500);
  };

  // ─── Toggle a rating for an exercise ─────────────────────
  const handleRate = (exerciseName, difficulty) => {
    setRatings(prev => ({
      ...prev,
      [exerciseName]: prev[exerciseName] === difficulty ? null : difficulty,
    }));
  };

  // ─── Save ratings + go back to dashboard ─────────────────
  const handleBack = async () => {
    setSaving(true);
    try {
      const ratingsList = exercises
        .map(ex => ({ name: ex.name, difficulty: ratings[ex.name] || null }))
        .filter(r => r.difficulty !== null);

      if (ratingsList.length > 0) {
        await saveExerciseRatings(mode, ratingsList);
      }
    } catch (e) {
      console.error('Failed to save ratings:', e);
    }
    navigate('/dashboard');
  };

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.centred}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading your {phase.label.toLowerCase()}…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── Phase transition flash ────────────────────────────────
  if (transitioning) {
    return <div style={styles.transitionScreen} />;
  }

  // ─── Done screen ──────────────────────────────────────────
  if (done) {
    return (
      <div style={styles.doneWrap}>
        {/* Fixed top banner */}
        <div style={{ ...styles.phaseBanner, background: phase.color }}>
          <span style={styles.phaseLabel}>{phase.label}</span>
        </div>

        <div style={styles.doneContent}>
          {/* Congrats section */}
          <div style={styles.doneTop}>
            <div style={styles.checkCircle}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill={phase.color} fillOpacity="0.15" />
                <path
                  d="M20 32l10 10 14-16"
                  stroke={phase.color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 style={styles.doneTitle}>{phase.label} Complete!</h2>
            <p style={styles.doneSub}>How did each exercise feel?</p>
          </div>

          {/* Exercise ratings list */}
          <div style={styles.ratingsList}>
            {exercises.map((ex, i) => (
              <div
                key={ex.name}
                style={{
                  ...styles.ratingRow,
                  borderBottom: i < exercises.length - 1
                    ? '1px solid rgba(255,255,255,0.06)'
                    : 'none',
                }}
              >
                <span style={styles.exerciseName}>{ex.name}</span>
                <div style={styles.iconRow}>
                  <Tooltip label="Easy">
                    <button
                      style={styles.iconBtn}
                      onClick={() => handleRate(ex.name, 'easy')}
                      aria-label="Easy"
                    >
                      <HappyIcon active={ratings[ex.name] === 'easy'} />
                    </button>
                  </Tooltip>
                  <Tooltip label="Moderate">
                    <button
                      style={styles.iconBtn}
                      onClick={() => handleRate(ex.name, 'moderate')}
                      aria-label="Moderate"
                    >
                      <NeutralIcon active={ratings[ex.name] === 'moderate'} />
                    </button>
                  </Tooltip>
                  <Tooltip label="Hard">
                    <button
                      style={styles.iconBtn}
                      onClick={() => handleRate(ex.name, 'hard')}
                      aria-label="Hard"
                    >
                      <SadIcon active={ratings[ex.name] === 'hard'} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>

          {/* Back button — works whether or not anything was rated */}
          <button
            style={{ ...styles.backBtn, opacity: saving ? 0.6 : 1 }}
            onClick={handleBack}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  // ─── No exercises ─────────────────────────────────────────
  if (!exercises.length) {
    return (
      <div style={styles.centred}>
        <p style={styles.loadingText}>No exercises found for this phase.</p>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          Go Back
        </button>
      </div>
    );
  }

  // ─── Active phase ─────────────────────────────────────────
  return (
    <>
      <PhaseBanner label={phase.label} color={phase.color} />
      <ExerciseCard
        exercises={exercises}
        onComplete={handlePhaseComplete}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─── Phase banner (fixed top strip) ──────────────────────────
function PhaseBanner({ label, color }) {
  return (
    <div style={{ ...styles.phaseBanner, background: color }}>
      <span style={styles.phaseLabel}>{label}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = {
  centred: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
    flexDirection: 'column',
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #84cc16',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontFamily: "'Figtree', sans-serif",
    margin: 0,
  },
  transitionScreen: {
    minHeight: '100dvh',
    background: '#0f172a',
  },
  phaseBanner: {
    position: 'fixed',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 430,
    zIndex: 20,
    padding: '6px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: 'white',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: "'Figtree', sans-serif",
  },
  // ─── Done screen ───────────────────────────────────────────
  doneWrap: {
    minHeight: '100dvh',
    background: '#0f172a',
    fontFamily: "'Figtree', sans-serif",
    overflowY: 'auto',
  },
  doneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '72px 24px 48px',
    gap: 24,
  },
  doneTop: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    marginBottom: 4,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: 'white',
    margin: 0,
    textAlign: 'center',
  },
  doneSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    margin: 0,
    textAlign: 'center',
  },
  // ─── Ratings list ──────────────────────────────────────────
  ratingsList: {
    width: '100%',
    maxWidth: 400,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: '4px 16px',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: "'Figtree', sans-serif",
    flex: 1,
    marginRight: 8,
    lineHeight: 1.3,
  },
  iconRow: {
    display: 'flex',
    gap: 2,
    alignItems: 'center',
    flexShrink: 0,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 5,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
    transition: 'transform 0.1s ease',
  },
  // ─── Back button ───────────────────────────────────────────
  backBtn: {
    marginTop: 8,
    background: '#84cc16',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    padding: '15px 32px',
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'Figtree', sans-serif",
    cursor: 'pointer',
    width: '100%',
    maxWidth: 320,
  },
};
