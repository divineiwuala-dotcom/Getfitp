import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FEELINGS = [
  {
    value: 'fresh',
    label: 'Fresh',
    sub: 'Ready to push hard',
    color: '#84cc16',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#84cc16" strokeWidth="1.8" />
        <path d="M10 18s2 3 6 3 6-3 6-3" stroke="#84cc16" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="13" r="1.5" fill="#84cc16" />
        <circle cx="20" cy="13" r="1.5" fill="#84cc16" />
        <path d="M13 9c0 0 1-2 3-2s3 2 3 2" stroke="#84cc16" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'good',
    label: 'Good',
    sub: 'Feeling normal',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#2563eb" strokeWidth="1.8" />
        <path d="M11 19s2 2 5 2 5-2 5-2" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="13" r="1.5" fill="#2563eb" />
        <circle cx="20" cy="13" r="1.5" fill="#2563eb" />
      </svg>
    ),
  },
  {
    value: 'tired',
    label: 'Tired',
    sub: 'Low energy today',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#f59e0b" strokeWidth="1.8" />
        <path d="M11 20s2 1 5 1 5-1 5-1" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10 13h4M18 13h4" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'sore',
    label: 'Sore',
    sub: 'Muscles still recovering',
    color: '#ef4444',
    bg: '#fff1f2',
    border: '#fecdd3',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#ef4444" strokeWidth="1.8" />
        <path d="M11 21s2-1 5-1 5 1 5 1" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M11 12l2 2-2 2M21 12l-2 2 2 2" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function HowAreYouFeeling() {
  const navigate  = useNavigate();
  const [selected, setSelected] = useState(null);
  const [leaving, setLeaving]   = useState(false);

  const handleSelect = (value) => {
    if (leaving) return;
    setSelected(value);
    setLeaving(true);

    // Save to sessionStorage so SessionSetup can pass it to groq
    sessionStorage.setItem('getfit_feeling', value);

    setTimeout(() => {
      navigate('/setup');
    }, 500);
  };

  return (
    <div style={styles.page}>
      {/* Top section */}
      <div style={styles.top}>
        <div style={styles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 3C14 3 7 9 7 15a7 7 0 0014 0c0-6-7-12-7-12z"
              stroke="#ef4444" strokeWidth="1.6" strokeLinejoin="round" fill="#fee2e2" />
          </svg>
        </div>
        <h1 style={styles.title}>How's your body feeling?</h1>
        <p style={styles.sub}>This helps your coach tailor today's session.</p>
      </div>

      {/* Feeling cards */}
      <div style={styles.cards}>
        {FEELINGS.map((f) => (
          <button
            key={f.value}
            style={{
              ...styles.card,
              background: selected === f.value ? f.bg : 'white',
              borderColor: selected === f.value ? f.color : '#e5e7eb',
              transform: selected === f.value ? 'scale(0.97)' : 'scale(1)',
              opacity: leaving && selected !== f.value ? 0.4 : 1,
            }}
            onClick={() => handleSelect(f.value)}
          >
            <div style={styles.cardIcon}>{f.icon}</div>
            <div style={styles.cardText}>
              <p style={{ ...styles.cardLabel, color: f.color }}>{f.label}</p>
              <p style={styles.cardSub}>{f.sub}</p>
            </div>
            {selected === f.value && (
              <div style={{ ...styles.checkCircle, background: f.color }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100dvh',
    background: '#f2f2f7',
    maxWidth: 430,
    margin: '0 auto',
    padding: '0 0 40px',
    fontFamily: "'Figtree', sans-serif",
    animation: 'fadeIn 0.4s ease',
  },
  top: {
    padding: '64px 24px 32px',
    textAlign: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: 26,
    fontWeight: 900,
    color: '#0f172a',
    letterSpacing: '-0.5px',
    margin: '0 0 10px',
    lineHeight: 1.2,
  },
  sub: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: 500,
    margin: 0,
  },
  cards: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '0 20px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '18px 16px',
    border: '2px solid',
    borderRadius: 16,
    cursor: 'pointer',
    fontFamily: "'Figtree', sans-serif",
    textAlign: 'left',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  cardIcon: {
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: 800,
    margin: '0 0 2px',
  },
  cardSub: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: 500,
    margin: 0,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
