import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, getTodaySession, saveTodaySession, getRecentHistory } from '../services/firebase';
import { generateDailySession } from '../services/groq';
import { getYouTubeVideo } from '../services/youtube';

const WARMUP_TIMES   = [5, 10, 15];
const WORKOUT_TIMES  = [10, 15, 20, 30];
const RECOVERY_TIMES = [5, 10, 15];
const RECOVERY_TYPES = [
  { value: 'Full Body Stretch', icon: '🤸', desc: 'Stretches for the whole body' },
  { value: 'Yoga',              icon: '🧘', desc: 'Holds and flows' },
  { value: 'Foam Rolling',      icon: '🪵', desc: 'Muscle release' },
  { value: 'Mobility Work',     icon: '🔄', desc: 'Joint mobility' },
  { value: 'Breathwork',        icon: '🫁', desc: 'Breathing and relaxation' },
];

async function attachVideoIds(sessionData) {
  const allExercises = [
    ...(sessionData.warmup    || []),
    ...(sessionData.exercises || []),
    ...(sessionData.recovery  || []),
  ];
  await Promise.all(
    allExercises.map(async (ex) => {
      if (!ex.videoId) {
        ex.videoId = await getYouTubeVideo(ex.name);
      }
    })
  );
  return sessionData;
}

export default function SessionSetup() {
  const navigate = useNavigate();

  const [warmupTime,    setWarmupTime]    = useState(5);
  const [workoutTime,   setWorkoutTime]   = useState(20);
  const [recoveryTime,  setRecoveryTime]  = useState(10);
  const [recoveryType,  setRecoveryType]  = useState('Full Body Stretch');
  const [generating,    setGenerating]    = useState(false);
  const [error,         setError]         = useState('');

  const feelingToday = sessionStorage.getItem('getfit_feeling') || 'good';

  const totalTime = warmupTime + workoutTime + recoveryTime;

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setError('');

    const sessionSetup = {
      warmupDuration:   warmupTime,
      workoutDuration:  workoutTime,
      recoveryDuration: recoveryTime,
      recoveryType,
    };

    try {
      // Check if session already exists today
      const existing = await getTodaySession();
      if (existing) {
        navigate('/dashboard');
        return;
      }

      const profile  = await getUserProfile();
      const history  = await getRecentHistory(3);
      let session    = await generateDailySession(profile, history, sessionSetup, feelingToday);
      session        = await attachVideoIds(session);

      // Save setup choices into session document
      session.setupChoices  = sessionSetup;
      session.feelingToday  = feelingToday;
      session.phasesComplete = { warmup: false, workout: false, recovery: false };

      await saveTodaySession(session);
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      setError('Could not generate session. Check your connection and try again.');
      setGenerating(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Today's Setup</h1>
        <p style={styles.sub}>Pick how much time you have for each part.</p>
        <div style={styles.totalBadge}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#2563eb" strokeWidth="1.3" />
            <path d="M7 4v3l2 1.5" stroke="#2563eb" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span>Total: {totalTime} min</span>
        </div>
      </div>

      {/* Warmup card */}
      <SetupCard
        phase="Warm Up"
        color="#f59e0b"
        bgColor="#fffbeb"
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="4" stroke="#f59e0b" strokeWidth="1.5" />
            <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4"
              stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        }
        times={WARMUP_TIMES}
        selected={warmupTime}
        onSelect={setWarmupTime}
      />

      {/* Main workout card */}
      <SetupCard
        phase="Main Workout"
        color="#2563eb"
        bgColor="#eff6ff"
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="8" width="3" height="4" rx="1" fill="#2563eb" />
            <rect x="16" y="8" width="3" height="4" rx="1" fill="#2563eb" />
            <rect x="4" y="6" width="3" height="8" rx="1" fill="#2563eb" />
            <rect x="13" y="6" width="3" height="8" rx="1" fill="#2563eb" />
            <rect x="7" y="9" width="6" height="2" rx="1" fill="#2563eb" />
          </svg>
        }
        times={WORKOUT_TIMES}
        selected={workoutTime}
        onSelect={setWorkoutTime}
      />

      {/* Recovery card */}
      <div style={{ ...styles.card, borderColor: '#bbf7d0' }}>
        <div style={{ ...styles.cardHeader, background: '#f0fdf4' }}>
          <div style={styles.cardHeaderLeft}>
            <div style={{ ...styles.phaseIcon, background: '#dcfce7' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3c-1 2-4 4-4 7a4 4 0 008 0c0-3-3-5-4-7z"
                  stroke="#84cc16" strokeWidth="1.5" strokeLinejoin="round" fill="#dcfce7" />
              </svg>
            </div>
            <div>
              <p style={{ ...styles.phaseName, color: '#84cc16' }}>Recovery</p>
              <p style={styles.phaseDesc}>Cooldown and stretch</p>
            </div>
          </div>
        </div>

        {/* Time picker */}
        <div style={styles.timePicker}>
          {RECOVERY_TIMES.map((t) => (
            <button
              key={t}
              style={{
                ...styles.timeBtn,
                background: recoveryTime === t ? '#84cc16' : 'transparent',
                color:      recoveryTime === t ? 'white'   : '#374151',
                borderColor: recoveryTime === t ? '#84cc16' : '#e5e7eb',
                fontWeight:  recoveryTime === t ? 700 : 500,
              }}
              onClick={() => setRecoveryTime(t)}
            >
              {t} min
            </button>
          ))}
        </div>

        {/* Recovery type picker */}
        <div style={styles.typePickerWrap}>
          <p style={styles.typeLabel}>Recovery type</p>
          <div style={styles.typePicker}>
            {RECOVERY_TYPES.map((rt) => (
              <button
                key={rt.value}
                style={{
                  ...styles.typeBtn,
                  background:  recoveryType === rt.value ? '#f0fdf4' : 'white',
                  borderColor: recoveryType === rt.value ? '#84cc16' : '#e5e7eb',
                  color:       recoveryType === rt.value ? '#15803d' : '#374151',
                }}
                onClick={() => setRecoveryType(rt.value)}
              >
                <span style={styles.typeIcon}>{rt.icon}</span>
                <span style={styles.typeName}>{rt.value}</span>
                <span style={styles.typeDesc}>{rt.desc}</span>
                {recoveryType === rt.value && (
                  <div style={styles.typeCheck}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorCard}>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Generate button */}
      <div style={styles.footer}>
        <button
          style={{
            ...styles.generateBtn,
            opacity: generating ? 0.7 : 1,
          }}
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <div style={styles.generatingRow}>
              <div style={styles.spinner} />
              <span>Building your session…</span>
            </div>
          ) : (
            `Generate My Session · ${totalTime} min`
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Reusable setup card for warmup + main workout ────────────
function SetupCard({ phase, color, bgColor, icon, times, selected, onSelect }) {
  return (
    <div style={{ ...styles.card, borderColor: `${color}40` }}>
      <div style={{ ...styles.cardHeader, background: bgColor }}>
        <div style={styles.cardHeaderLeft}>
          <div style={{ ...styles.phaseIcon, background: `${color}20` }}>
            {icon}
          </div>
          <div>
            <p style={{ ...styles.phaseName, color }}>{phase}</p>
            <p style={styles.phaseDesc}>Pick your duration</p>
          </div>
        </div>
        <div style={{ ...styles.selectedBadge, background: `${color}15`, color }}>
          {selected} min
        </div>
      </div>
      <div style={styles.timePicker}>
        {times.map((t) => (
          <button
            key={t}
            style={{
              ...styles.timeBtn,
              background:  selected === t ? color : 'transparent',
              color:       selected === t ? 'white' : '#374151',
              borderColor: selected === t ? color   : '#e5e7eb',
              fontWeight:  selected === t ? 700 : 500,
            }}
            onClick={() => onSelect(t)}
          >
            {t} min
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100dvh',
    background: '#f2f2f7',
    maxWidth: 430,
    margin: '0 auto',
    padding: '0 0 120px',
    fontFamily: "'Figtree', sans-serif",
    animation: 'fadeIn 0.35s ease',
  },
  header: {
    padding: '56px 20px 20px',
  },
  title: {
    fontSize: 30,
    fontWeight: 900,
    color: '#0f172a',
    letterSpacing: '-0.5px',
    margin: '0 0 6px',
  },
  sub: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: 500,
    margin: '0 0 14px',
  },
  totalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 20,
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 700,
    color: '#2563eb',
  },
  card: {
    background: 'white',
    borderRadius: 16,
    border: '1.5px solid',
    margin: '0 20px 14px',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  phaseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  phaseName: {
    fontSize: 15,
    fontWeight: 800,
    margin: '0 0 2px',
  },
  phaseDesc: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 500,
    margin: 0,
  },
  selectedBadge: {
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
  },
  timePicker: {
    display: 'flex',
    gap: 8,
    padding: '12px 16px 16px',
    flexWrap: 'wrap',
  },
  timeBtn: {
    padding: '8px 16px',
    borderRadius: 10,
    border: '1.5px solid',
    fontFamily: "'Figtree', sans-serif",
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  typePickerWrap: {
    padding: '0 16px 16px',
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    margin: '0 0 10px',
  },
  typePicker: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  typeBtn: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto auto',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    border: '1.5px solid',
    borderRadius: 12,
    fontFamily: "'Figtree', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'left',
  },
  typeIcon: {
    fontSize: 18,
  },
  typeName: {
    fontSize: 14,
    fontWeight: 700,
  },
  typeDesc: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 500,
  },
  typeCheck: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#84cc16',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    margin: '0 20px 14px',
    background: '#fff1f2',
    borderRadius: 12,
    padding: '12px 16px',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: 500,
    margin: 0,
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 430,
    padding: '16px 20px 32px',
    background: 'linear-gradient(to top, #f2f2f7 70%, transparent)',
  },
  generateBtn: {
    width: '100%',
    padding: '18px',
    background: '#84cc16',
    color: 'white',
    border: 'none',
    borderRadius: 16,
    fontFamily: "'Figtree', sans-serif",
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(132,204,22,0.35)',
  },
  generatingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  spinner: {
    width: 18,
    height: 18,
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTop: '2.5px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
