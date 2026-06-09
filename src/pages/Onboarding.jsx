import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProfile, auth } from '../services/firebase';
import Icon from '../components/Icon';

const steps = [
  {
    id: 'goal',
    title: "What's your goal?",
    subtitle: 'Pick the one that matters most right now',
    type: 'single',
    options: [
      { value: 'athletic', label: 'Athletic Look', icon: 'lightning', desc: 'Lean, defined, proportional' },
      { value: 'muscle', label: 'Build Muscle', icon: 'biceps', desc: 'Size and strength gains' },
      { value: 'lose_fat', label: 'Lose Fat', icon: 'fire', desc: 'Burn fat, reveal tone' },
      { value: 'endurance', label: 'Endurance', icon: 'runner', desc: 'Stamina and cardio' },
    ],
  },
  {
    id: 'level',
    title: 'Your fitness level?',
    subtitle: 'Be honest — the plan adapts to you',
    type: 'single',
    options: [
      { value: 'beginner', label: 'Beginner', icon: 'seedling', desc: 'Less than 6 months training' },
      { value: 'intermediate', label: 'Intermediate', icon: 'sparkle', desc: '6 months to 2 years' },
      { value: 'advanced', label: 'Advanced', icon: 'trophy', desc: '2+ years consistent training' },
    ],
  },
  {
    id: 'stats',
    title: 'A bit about you',
    subtitle: 'Used to personalise every session',
    type: 'stats',
  },
  {
    id: 'days',
    title: 'Which days will you train?',
    subtitle: 'Tap to select your training days',
    type: 'multi',
    options: [
      { value: 'Mon', label: 'Mon' },
      { value: 'Tue', label: 'Tue' },
      { value: 'Wed', label: 'Wed' },
      { value: 'Thu', label: 'Thu' },
      { value: 'Fri', label: 'Fri' },
      { value: 'Sat', label: 'Sat' },
      { value: 'Sun', label: 'Sun' },
    ],
  },
  {
    id: 'duration',
    title: 'Workout duration?',
    subtitle: 'How much time do you have per session',
    type: 'single',
    options: [
      { value: 'short', label: 'Short', icon: 'stopwatch', desc: '10–15 min' },
      { value: 'medium', label: 'Medium', icon: 'alarm', desc: '15–25 min' },
      { value: 'long', label: 'Long', icon: 'clock', desc: '25–40 min' },
    ],
  },
  {
    id: 'equipment',
    title: 'Equipment available?',
    subtitle: 'Select everything you have access to',
    type: 'multi',
    options: [
      { value: 'bodyweight', label: 'Bodyweight only', icon: 'seedling' },
      { value: 'dumbbells', label: 'Dumbbells', icon: 'dumbbell' },
      { value: 'resistance_bands', label: 'Resistance Bands', icon: 'sparkle' },
      { value: 'pull_up_bar', label: 'Pull-up Bar', icon: 'arrowLeft' },
      { value: 'gym', label: 'Full Gym', icon: 'dumbbell' },
    ],
  },
  {
    id: 'injuries',
    title: 'Any injuries or limitations?',
    subtitle: "We'll work around them",
    type: 'multi',
    options: [
      { value: 'none', label: 'None', icon: 'check' },
      { value: 'lower_back', label: 'Lower back', icon: 'cross' },
      { value: 'knees', label: 'Knees', icon: 'biceps' },
      { value: 'shoulders', label: 'Shoulders', icon: 'sparkle' },
      { value: 'wrists', label: 'Wrists', icon: 'cross' },
    ],
  },
];

const DEFAULT_STATS = { age: '', weight: '', height: '' };

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const current = steps[step];
  const value = answers[current.id];

  const isSelected = (opt) => {
    if (current.type === 'single') return value === opt.value;
    return Array.isArray(value) && value.includes(opt.value);
  };

  const toggle = (opt) => {
    if (current.type === 'single') {
      setAnswers(prev => ({ ...prev, [current.id]: opt.value }));
    } else {
      setAnswers(prev => {
        const arr = prev[current.id] || [];
        if (arr.includes(opt.value)) {
          return { ...prev, [current.id]: arr.filter(v => v !== opt.value) };
        }
        if (opt.value === 'none') return { ...prev, [current.id]: ['none'] };
        return { ...prev, [current.id]: [...arr.filter(v => v !== 'none'), opt.value] };
      });
    }
  };

  const statsValid = () => {
    const age = parseInt(stats.age);
    const weight = parseFloat(stats.weight);
    return age >= 10 && age <= 100 && weight >= 20 && weight <= 300 && stats.height.trim().length > 0;
  };

  const canProceed = () => {
    if (current.type === 'stats') return statsValid();
    if (!value) return false;
    if (current.type === 'multi' && value.length === 0) return false;
    return true;
  };

  const next = async () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      await submit();
    }
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const profile = {
        name: auth.currentUser?.displayName || '',
        age: parseInt(stats.age),
        weight: `${stats.weight}kg`,
        height: stats.height.trim(),
        ...answers,
        createdAt: new Date().toISOString(),
      };
      await saveProfile(profile);
      navigate('/feeling', { replace: true });
    } catch (e) {
      console.error(e);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingInner}>
          <div style={styles.spinner} />
          <h2 style={styles.loadingTitle}>Setting up your profile...</h2>
          <p style={styles.loadingSubtitle}>Your AI coach will build today's session when you arrive.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <div style={styles.stepCount}>{step + 1} / {steps.length}</div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <h1 style={styles.title}>{current.title}</h1>
        <p style={styles.subtitle}>{current.subtitle}</p>

        {/* Stats step */}
        {current.type === 'stats' && (
          <div style={styles.statsForm}>
            <div style={styles.statField}>
              <label style={styles.statLabel}>Age</label>
              <div style={styles.statInputWrap}>
                <input
                  style={styles.statInput}
                  type="number"
                  placeholder="18"
                  min="10"
                  max="100"
                  value={stats.age}
                  onChange={e => setStats(s => ({ ...s, age: e.target.value }))}
                />
                <span style={styles.statUnit}>yrs</span>
              </div>
            </div>

            <div style={styles.statField}>
              <label style={styles.statLabel}>Weight</label>
              <div style={styles.statInputWrap}>
                <input
                  style={styles.statInput}
                  type="number"
                  placeholder="66"
                  min="20"
                  max="300"
                  value={stats.weight}
                  onChange={e => setStats(s => ({ ...s, weight: e.target.value }))}
                />
                <span style={styles.statUnit}>kg</span>
              </div>
            </div>

            <div style={styles.statField}>
              <label style={styles.statLabel}>Height</label>
              <div style={styles.statInputWrap}>
                <input
                  style={{ ...styles.statInput, flex: 1 }}
                  type="text"
                  placeholder={'5\'9" or 175cm'}
                  value={stats.height}
                  onChange={e => setStats(s => ({ ...s, height: e.target.value }))}
                />
              </div>
            </div>

            <p style={styles.statsNote}>
              This helps your coach set appropriate intensity and track progress.
            </p>
          </div>
        )}

        {/* Days grid */}
        {current.id === 'days' && (
          <div style={styles.daysGrid}>
            {current.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggle(opt)}
                style={{
                  ...styles.dayBtn,
                  ...(isSelected(opt) ? styles.dayBtnActive : {}),
                }}
              >
                {isSelected(opt) && <span style={styles.dayCheck}>✓</span>}
                <span style={styles.dayLabel}>{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Standard option list */}
        {current.type !== 'stats' && current.id !== 'days' && (
          <div style={styles.optionsList}>
            {current.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggle(opt)}
                style={{
                  ...styles.optionBtn,
                  ...(isSelected(opt) ? styles.optionBtnActive : {}),
                }}
              >
                {opt.icon && (
                  <span style={styles.optionEmoji}>
                    <Icon name={opt.icon} size={24} />
                  </span>
                )}
                <div style={styles.optionText}>
                  <span style={styles.optionLabel}>{opt.label}</span>
                  {opt.desc && <span style={styles.optionDesc}>{opt.desc}</span>}
                </div>
                <div style={{
                  ...styles.checkCircle,
                  ...(isSelected(opt) ? styles.checkCircleActive : {}),
                }}>
                  {isSelected(opt) && <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>✓</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>

      {/* CTA */}
      <div style={styles.footer}>
        <button
          className="btn-lime"
          onClick={next}
          disabled={!canProceed()}
          style={{ opacity: canProceed() ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {step === steps.length - 1
            ? (<><span>Let's Go</span><Icon name="rocket" size={18} /></>)
            : 'Continue'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
  },
  header: {
    padding: '56px 20px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    background: 'var(--gray-light)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--lime)',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  stepCount: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--gray)',
    minWidth: 40,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: '8px 20px 24px',
    overflowY: 'auto',
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    color: 'var(--black)',
    letterSpacing: '-0.5px',
    marginBottom: 8,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 15,
    color: 'var(--gray)',
    marginBottom: 28,
    fontWeight: 500,
  },
  // Stats step
  statsForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  statField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--gray)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statInputWrap: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--white)',
    borderRadius: 'var(--radius)',
    border: '2px solid transparent',
    boxShadow: 'var(--shadow)',
    padding: '0 16px',
    gap: 8,
  },
  statInput: {
    flex: 1,
    padding: '16px 0',
    border: 'none',
    background: 'transparent',
    fontFamily: 'inherit',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--black)',
    outline: 'none',
    width: '100%',
  },
  statUnit: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--gray)',
    flexShrink: 0,
  },
  statsNote: {
    fontSize: 13,
    color: 'var(--gray)',
    marginTop: 4,
    lineHeight: 1.5,
  },
  // Options
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'var(--white)',
    border: '2px solid transparent',
    borderRadius: 'var(--radius)',
    padding: '16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'border-color 0.15s, background 0.15s',
    boxShadow: 'var(--shadow)',
  },
  optionBtnActive: {
    border: '2px solid var(--blue)',
    background: 'var(--blue-light)',
  },
  optionEmoji: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--black)',
  },
  optionDesc: {
    fontSize: 13,
    color: 'var(--gray)',
    fontWeight: 500,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2px solid var(--gray-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    flexShrink: 0,
  },
  checkCircleActive: {
    background: 'var(--blue)',
    borderColor: 'var(--blue)',
  },
  // Days
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
  dayBtn: {
    position: 'relative',
    background: 'var(--white)',
    border: '2px solid transparent',
    borderRadius: 'var(--radius-sm)',
    padding: '20px 8px',
    cursor: 'pointer',
    textAlign: 'center',
    boxShadow: 'var(--shadow)',
    transition: 'all 0.15s',
  },
  dayBtnActive: {
    border: '2px solid var(--blue)',
    background: 'var(--blue-light)',
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--black)',
    display: 'block',
  },
  dayCheck: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 11,
    color: 'var(--blue)',
    fontWeight: 900,
  },
  // Footer
  footer: {
    padding: '16px 20px 40px',
    background: 'var(--bg)',
  },
  error: {
    color: 'var(--red)',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: 500,
  },
  // Loading
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: 32,
  },
  loadingInner: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  spinner: {
    width: 56,
    height: 56,
    border: '4px solid var(--gray-light)',
    borderTop: '4px solid var(--lime)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 900,
    color: 'var(--black)',
    letterSpacing: '-0.3px',
  },
  loadingSubtitle: {
    fontSize: 15,
    color: 'var(--gray)',
    fontWeight: 500,
    maxWidth: 280,
    lineHeight: 1.5,
  },
};
