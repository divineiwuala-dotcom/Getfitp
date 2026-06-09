import React, { useEffect, useState } from 'react';
import { getProgress, getWorkoutHistory } from '../services/firebase';

export default function Progress() {
  const [progress, setProgress] = useState({ streak: 0, total: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [prog, hist] = await Promise.all([getProgress(), getWorkoutHistory()]);
      setProgress(prog || { streak: 0, total: 0 });
      setHistory(hist || []);
      setLoading(false);
    }
    load();
  }, []);

  // Build last 7 days chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = ['S','M','T','W','T','F','S'][d.getDay()];
    const dateStr = d.toDateString();
    const done = history.some(h => new Date(h.date).toDateString() === dateStr);
    return { label, done };
  });

  const maxBar = 60; // px

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e5e5ea', borderTop: '3px solid #84cc16', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="page" style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Progress</h1>
        <p style={styles.subtitle}>Keep the momentum going 💪</p>
      </div>

      {/* Big stats */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
          <span style={styles.statEmoji}>🔥</span>
          <span style={styles.statNum}>{progress.streak}</span>
          <span style={styles.statLabel}>Day Streak</span>
        </div>
        <div style={{ ...styles.statCard, background: 'linear-gradient(135deg, #84cc16, #65a30d)' }}>
          <span style={styles.statEmoji}>✅</span>
          <span style={styles.statNum}>{progress.total}</span>
          <span style={styles.statLabel}>Total Workouts</span>
        </div>
      </div>

      {/* Weekly chart */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>This Week</h2>
        <div className="card" style={styles.chartCard}>
          <div style={styles.chartBars}>
            {last7.map((day, i) => (
              <div key={i} style={styles.barWrapper}>
                <div style={styles.barTrack}>
                  <div style={{
                    ...styles.barFill,
                    height: day.done ? maxBar : 8,
                    background: day.done ? 'var(--lime)' : 'var(--gray-light)',
                  }} />
                </div>
                <span style={styles.barLabel}>{day.label}</span>
              </div>
            ))}
          </div>
          <div style={styles.chartLegend}>
            <div style={styles.legendDot} />
            <span style={styles.legendText}>Workout completed</span>
          </div>
        </div>
      </div>

      {/* Recent workouts */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Workouts</h2>
        {history.length === 0 ? (
          <div className="card" style={styles.emptyCard}>
            <span style={{ fontSize: 40 }}>🏋️</span>
            <p style={styles.emptyText}>No workouts yet. Start your first one!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.slice(0, 10).map((item, i) => (
              <div key={i} className="card" style={styles.historyItem}>
                <div style={styles.historyLeft}>
                  <div style={styles.historyDot} />
                  <div>
                    <p style={styles.historyTitle}>{item.muscleGroup || 'Full Body'}</p>
                    <p style={styles.historyDate}>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <span className="pill pill-lime" style={{ fontSize: 12 }}>Done ✓</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motivation card */}
      <div style={styles.section}>
        <div style={styles.motivationCard}>
          <p style={styles.motivationQuote}>"The body achieves what the mind believes."</p>
          <p style={styles.motivationAuthor}>— Your AI Coach</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: 'var(--bg)', paddingBottom: 100 },
  header: { padding: '56px 20px 20px' },
  title: {
    fontSize: 34,
    fontWeight: 900,
    color: 'var(--black)',
    letterSpacing: '-0.5px',
    marginBottom: 4,
  },
  subtitle: { fontSize: 16, color: 'var(--gray)', fontWeight: 500 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    padding: '0 20px 24px',
  },
  statCard: {
    borderRadius: 'var(--radius)',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    boxShadow: 'var(--shadow-lg)',
  },
  statEmoji: { fontSize: 28 },
  statNum: { fontSize: 40, fontWeight: 900, color: 'white', letterSpacing: '-1px' },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 },
  section: { padding: '0 20px 24px' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--black)',
    marginBottom: 12,
    letterSpacing: '-0.3px',
  },
  chartCard: {
    padding: '20px',
  },
  chartBars: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 12,
  },
  barWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barTrack: {
    width: 28,
    height: 60,
    display: 'flex',
    alignItems: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    transition: 'height 0.4s ease',
  },
  barLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--gray)',
  },
  chartLegend: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    borderTop: '1px solid var(--gray-light)',
    paddingTop: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    background: 'var(--lime)',
  },
  legendText: {
    fontSize: 13,
    color: 'var(--gray)',
    fontWeight: 500,
  },
  emptyCard: {
    padding: 32,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: 'var(--gray)',
    fontWeight: 500,
  },
  historyItem: {
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  historyDot: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'var(--blue-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  historyTitle: { fontSize: 15, fontWeight: 700, color: 'var(--black)', marginBottom: 2 },
  historyDate: { fontSize: 13, color: 'var(--gray)', fontWeight: 500 },
  motivationCard: {
    background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)',
    borderRadius: 'var(--radius)',
    padding: '24px 20px',
    textAlign: 'center',
  },
  motivationQuote: {
    fontSize: 17,
    fontWeight: 700,
    color: 'white',
    lineHeight: 1.5,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  motivationAuthor: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 600,
  },
};
