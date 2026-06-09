import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodaySession, getProgress, markWorkoutComplete } from '../services/firebase';
import WorkoutRating from '../components/WorkoutRating';

function estimateCalories(durationMin, exerciseCount) {
  return Math.round(durationMin * 6 + exerciseCount * 3);
}

export default function DayComplete() {
  const navigate = useNavigate();

  const [session, setSession]   = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [rated, setRated]       = useState(false);
  const [saving, setSaving]     = useState(false);

  const mountedAt = useRef(Date.now());

  useEffect(() => {
    async function load() {
      try {
        const [s, p] = await Promise.all([getTodaySession(), getProgress()]);
        setSession(s);
        setProgress(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRating = async (rating) => {
    setSaving(true);
    try {
      const durationMin = session?.estimatedDuration ?? Math.round((Date.now() - mountedAt.current) / 60000);
      const exerciseCount = (session?.exercises || []).length;
      const calories = estimateCalories(durationMin, exerciseCount);

      await markWorkoutComplete({
        muscleGroup:    session?.muscleGroup || 'Full Body',
        duration:       durationMin,
        rating,
        caloriesBurned: calories,
        exercises:      (session?.exercises || []).map((e) => e.name),
        feelingToday:   session?.feelingToday || null,
      });
    } catch (e) {
      console.error('Failed to save rating:', e);
    } finally {
      setSaving(false);
      setRated(true);
    }
  };

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.centred}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading your summary…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const dayNumber     = (progress?.total ?? 0) + 1;
  const durationMin   = session?.estimatedDuration ?? '—';
  const exerciseCount = (session?.exercises || []).length;
  const calories      = typeof durationMin === 'number'
    ? estimateCalories(durationMin, exerciseCount)
    : '—';
  const tomorrowFocus = session?.tomorrowFocus || 'Full Body';
  const streak        = progress?.streak ?? 0;

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={styles.inner}>

        {/* ── Header ─────────────────────────────────────── */}
        <div style={styles.headerWrap}>
          {/* Trophy icon */}
          <div style={styles.trophyWrap}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="28" fill="#84cc16" fillOpacity="0.13" />
              {/* Cup body */}
              <path d="M18 14h20v14a10 10 0 01-20 0V14z"
                stroke="#84cc16" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" />
              {/* Handles */}
              <path d="M18 20h-4a4 4 0 004 5" stroke="#84cc16" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M38 20h4a4 4 0 01-4 5"  stroke="#84cc16" strokeWidth="2.2" strokeLinecap="round" />
              {/* Stem */}
              <path d="M28 38v5M23 43h10" stroke="#84cc16" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={styles.title}>Day {dayNumber} Done!</h1>
          <p style={styles.subtitle}>You showed up. That's what counts.</p>

          {/* Streak badge */}
          {streak > 0 && (
            <div style={styles.streakBadge}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1C4.5 4.5 3 6 3 8.5a4 4 0 008 0C11 6 9.5 4.5 7 1z"
                  fill="#f59e0b" />
              </svg>
              <span style={styles.streakText}>{streak} day streak</span>
            </div>
          )}
        </div>

        {/* ── Stats row ──────────────────────────────────── */}
        <div style={styles.statsRow}>
          <StatCard value={`${durationMin}m`} label="Total time" />
          <StatCard value={exerciseCount}      label="Exercises"  />
          <StatCard value={`~${calories}`}     label="Calories"   />
        </div>

        {/* ── Rating ─────────────────────────────────────── */}
        <div style={styles.card}>
          {!rated ? (
            <>
              <p style={styles.ratingHeading}>How was today's session?</p>
              {saving
                ? <p style={styles.savingText}>Saving…</p>
                : <WorkoutRating onSubmit={handleRating} />
              }
            </>
          ) : (
            <div style={styles.ratedRow}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#84cc16" fillOpacity="0.15" />
                <path d="M6 10l3.5 3.5L14 7" stroke="#84cc16"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={styles.ratedText}>Rating saved — great work!</span>
            </div>
          )}
        </div>

        {/* ── Tomorrow teaser ────────────────────────────── */}
        <div style={styles.tomorrowCard}>
          <div style={styles.tomorrowTop}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 5 }}>
              <rect x="1" y="2.5" width="12" height="10.5" rx="2"
                stroke="#2563eb" strokeWidth="1.4" />
              <path d="M1 6h12M4.5 1v3M9.5 1v3"
                stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span style={styles.tomorrowEyebrow}>Tomorrow</span>
          </div>
          <h3 style={styles.tomorrowFocus}>{tomorrowFocus}</h3>
          <p style={styles.tomorrowNote}>
            Rest up — your {tomorrowFocus.toLowerCase()} session will be ready when you open the app.
          </p>
        </div>

        {/* ── CTA ────────────────────────────────────────── */}
        <button style={styles.homeBtn} onClick={() => navigate('/dashboard')}>
          Back to Home
        </button>

      </div>
    </div>
  );
}

// ─── Stat card sub-component ──────────────────────────────────
function StatCard({ value, label }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100dvh',
    background: '#0f172a',
    fontFamily: "'Figtree', sans-serif",
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 430,
    padding: '52px 20px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
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

  // Header
  headerWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    textAlign: 'center',
  },
  trophyWrap: { marginBottom: 8 },
  title: {
    fontSize: 30,
    fontWeight: 800,
    color: 'white',
    margin: 0,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    margin: 0,
  },
  streakBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(245,158,11,0.12)',
    borderRadius: 20,
    padding: '5px 12px',
    marginTop: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: 700,
    color: '#f59e0b',
  },

  // Stats
  statsRow: {
    display: 'flex',
    gap: 10,
  },
  statCard: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: '14px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 800,
    color: 'white',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },

  // Rating card
  card: {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: '20px 16px',
  },
  ratingHeading: {
    fontSize: 15,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.7)',
    margin: '0 0 14px',
    textAlign: 'center',
  },
  savingText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    margin: 0,
  },
  ratedRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ratedText: {
    fontSize: 15,
    fontWeight: 600,
    color: '#84cc16',
  },

  // Tomorrow card
  tomorrowCard: {
    background: 'rgba(37,99,235,0.12)',
    borderRadius: 16,
    padding: '18px 20px',
    border: '1px solid rgba(37,99,235,0.2)',
  },
  tomorrowTop: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 6,
  },
  tomorrowEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  tomorrowFocus: {
    fontSize: 20,
    fontWeight: 800,
    color: 'white',
    margin: '0 0 4px',
  },
  tomorrowNote: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
    lineHeight: 1.5,
  },

  // CTA
  homeBtn: {
    background: '#84cc16',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    padding: '16px',
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'Figtree', sans-serif",
    cursor: 'pointer',
    width: '100%',
    marginTop: 4,
  },
};
