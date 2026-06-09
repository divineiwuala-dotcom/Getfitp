import { useState } from "react";

const ratings = [
  {
    value: "easy",
    label: "Too Easy",
    sub: "I could've done more",
    color: "#84cc16",
    bg: "#f0fdf4",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#84cc16" strokeWidth="2" />
        <circle cx="11" cy="13" r="2" fill="#84cc16" />
        <circle cx="21" cy="13" r="2" fill="#84cc16" />
        <path d="M10 20c1.5 2 4 3 6 3s4.5-1 6-3" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "perfect",
    label: "Just Right",
    sub: "Challenging but doable",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#2563eb" strokeWidth="2" />
        <circle cx="11" cy="13" r="2" fill="#2563eb" />
        <circle cx="21" cy="13" r="2" fill="#2563eb" />
        <path d="M10 19.5c1.5 2.5 4.5 3.5 6 3.5s4.5-1 6-3.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "hard",
    label: "Too Hard",
    sub: "I struggled through it",
    color: "#ef4444",
    bg: "#fff1f2",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#ef4444" strokeWidth="2" />
        <circle cx="11" cy="13" r="2" fill="#ef4444" />
        <circle cx="21" cy="13" r="2" fill="#ef4444" />
        <path d="M10 22c1.5-2 4-3 6-3s4.5 1 6 3" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function WorkoutRating({ stats = {}, onSubmit }) {
  const { duration = 0, exerciseCount = 0, calories = 0 } = stats;
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    setTimeout(() => {
      onSubmit?.(selected);
    }, 1200);
  };

  const active = ratings.find((r) => r.value === selected);

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.successWrap}>
          <div style={styles.successIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" fill="#84cc16" />
              <path d="M14 24l7 7 13-13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={styles.successTitle}>Saved!</p>
          <p style={styles.successSub}>Your coach will adapt tomorrow's session.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.trophy}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 28v6M14 34h12" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M8 6h4v14a8 8 0 0016 0V6h4" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 6c0 6 4 8 4 8M32 6c0 6-4 8-4 8" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 style={styles.title}>Workout Complete</h1>
        <p style={styles.subtitle}>Great work, Div!</p>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginBottom: 4 }}>
            <circle cx="10" cy="10" r="8" stroke="#2563eb" strokeWidth="1.5" />
            <path d="M10 6v4l3 2" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={styles.statVal}>{duration}</span>
          <span style={styles.statLabel}>min</span>
        </div>
        <div style={styles.statCard}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginBottom: 4 }}>
            <path d="M6 16V8l4-4 4 4v8" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 16v-4h4v4" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={styles.statVal}>{exerciseCount}</span>
          <span style={styles.statLabel}>exercises</span>
        </div>
        <div style={styles.statCard}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginBottom: 4 }}>
            <path d="M10 3c0 0-5 4-5 8a5 5 0 0010 0c0-4-5-8-5-8z" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <span style={styles.statVal}>{calories}</span>
          <span style={styles.statLabel}>kcal</span>
        </div>
      </div>

      {/* Rating Section */}
      <div style={styles.ratingSection}>
        <p style={styles.ratingQuestion}>How did that feel?</p>
        <p style={styles.ratingHint}>Your coach adapts tomorrow based on this.</p>

        <div style={styles.ratingOptions}>
          {ratings.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelected(r.value)}
              style={{
                ...styles.ratingBtn,
                background: selected === r.value ? r.bg : "white",
                borderColor: selected === r.value ? r.color : "#e5e7eb",
                transform: selected === r.value ? "scale(1.03)" : "scale(1)",
              }}
            >
              <div style={styles.ratingIcon}>{r.icon}</div>
              <div>
                <p style={{ ...styles.ratingLabel, color: selected === r.value ? r.color : "#111" }}>
                  {r.label}
                </p>
                <p style={styles.ratingSub}>{r.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div style={styles.footer}>
        {active && (
          <p style={styles.adaptMsg}>
            {active.value === "easy" && "Next session will be more challenging."}
            {active.value === "perfect" && "Keep the momentum going."}
            {active.value === "hard" && "Tomorrow will be lighter so you can recover."}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!selected}
          style={{
            ...styles.submitBtn,
            opacity: selected ? 1 : 0.4,
          }}
        >
          Save & Finish
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#f2f2f7",
    maxWidth: 430,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    padding: "0 0 32px",
    fontFamily: "'Figtree', sans-serif",
  },
  header: {
    textAlign: "center",
    padding: "48px 24px 24px",
  },
  trophy: {
    width: 72,
    height: 72,
    background: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: "#111",
    margin: "0 0 6px",
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    margin: 0,
  },
  statsRow: {
    display: "flex",
    gap: 10,
    padding: "0 16px 24px",
  },
  statCard: {
    flex: 1,
    background: "white",
    borderRadius: 16,
    padding: "14px 8px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  statVal: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111",
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: 500,
    marginTop: 2,
  },
  ratingSection: {
    padding: "0 16px",
    flex: 1,
  },
  ratingQuestion: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111",
    margin: "0 0 4px",
  },
  ratingHint: {
    fontSize: 13,
    color: "#9ca3af",
    margin: "0 0 16px",
  },
  ratingOptions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  ratingBtn: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px",
    borderRadius: 16,
    border: "2px solid",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left",
    width: "100%",
  },
  ratingIcon: {
    flexShrink: 0,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: 700,
    margin: "0 0 2px",
  },
  ratingSub: {
    fontSize: 12,
    color: "#6b7280",
    margin: 0,
  },
  footer: {
    padding: "24px 16px 0",
  },
  adaptMsg: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: 500,
    textAlign: "center",
    marginBottom: 12,
  },
  submitBtn: {
    width: "100%",
    padding: "16px",
    background: "#84cc16",
    color: "white",
    fontFamily: "'Figtree', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  successWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: 800,
    color: "#111",
    margin: "0 0 8px",
  },
  successSub: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    margin: 0,
  },
};
