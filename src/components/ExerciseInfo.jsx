import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import muscleSvg from '../assets/human_body_muscle.svg?raw';

// ─── Muscle alias map ─────────────────────────────────────────
const MUSCLE_ALIASES = {
  chest:       ['chest', 'pecs', 'pectorals', 'pectoral', 'upper chest'],
  abs:         ['abs', 'abdominals', 'core', 'abdomen', 'stomach', 'abdominal'],
  obliques:    ['obliques', 'oblique', 'side abs', 'love handles'],
  shoulders:   ['shoulders', 'shoulder', 'deltoids', 'delts', 'delt', 'anterior delt', 'front delt'],
  biceps:      ['biceps', 'bicep', 'upper arm', 'front arm'],
  quads:       ['quads', 'quadriceps', 'quad', 'thighs', 'front thighs', 'thigh'],
  hip_flexors: ['hip flexors', 'hip flexor', 'hips', 'hip'],
  calves:      ['calves', 'calf', 'lower leg'],
  traps:       ['traps', 'trapezius', 'upper back', 'trap'],
  lats:        ['lats', 'latissimus', 'latissimus dorsi', 'mid back', 'back'],
  lower_back:  ['lower back', 'lumbar', 'erectors', 'spinal erectors', 'lower back muscles'],
  glutes:      ['glutes', 'glute', 'gluteus', 'butt', 'buttocks', 'gluteus maximus'],
  hamstrings:  ['hamstrings', 'hamstring', 'back of thigh', 'back thigh'],
  triceps:     ['triceps', 'tricep', 'back of arm', 'back arm'],
};

function resolveMuscleName(name) {
  const lower = name.toLowerCase().trim();
  for (const [id, aliases] of Object.entries(MUSCLE_ALIASES)) {
    if (aliases.some(alias => lower.includes(alias) || alias.includes(lower))) {
      return id;
    }
  }
  return null;
}

const MUSCLE_TO_SVG = {
  chest:       ['front_chest'],
  abs:         ['front_abs_upper', 'front_abs_lower'],
  obliques:    ['front_obliques'],
  shoulders:   ['front_deltoid', 'back_rear_deltoid'],
  biceps:      ['front_biceps'],
  forearms:    ['front_forearm', 'back_forearms'],
  hip_flexors: ['front_adductors'],
  quads:       ['front_quads'],
  calves:      ['front_calves', 'back_calves', 'front_tibialis', 'back_achilles'],
  traps:       ['front_traps', 'back_traps'],
  lats:        ['back_lats'],
  lower_back:  ['back_lower_back'],
  triceps:     ['back_triceps'],
  glutes:      ['back_glutes'],
  hamstrings:  ['back_hamstrings', 'back_adductors'],
};

function matchesPrefix(id, prefix) {
  return id === prefix || new RegExp(`^${prefix}(_\\d+)?$`).test(id);
}

function MuscleMap({ primary = [], secondary = [] }) {
  const containerRef = useRef(null);

  const resolvedPrimary   = primary.map(resolveMuscleName).filter(Boolean);
  const resolvedSecondary = secondary.map(resolveMuscleName).filter(Boolean);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !muscleSvg) return;
    const svg = container.querySelector('svg');
    if (!svg) return;

    const primaryPrefixes   = new Set(resolvedPrimary.flatMap(m => MUSCLE_TO_SVG[m] || []));
    const secondaryPrefixes = new Set(resolvedSecondary.flatMap(m => MUSCLE_TO_SVG[m] || []));

    svg.querySelectorAll('path[id]').forEach(path => {
      const id = path.getAttribute('id');
      if (/^Vector/.test(id)) return;

      const isPrimary   = [...primaryPrefixes].some(p => matchesPrefix(id, p));
      const isSecondary = [...secondaryPrefixes].some(p => matchesPrefix(id, p));

      if (isPrimary)        path.style.fill = '#ef4444';
      else if (isSecondary) path.style.fill = '#fb923c';
      else                  path.style.fill = 'rgba(180, 185, 196, 0.55)';
    });
  }, [resolvedPrimary.join(), resolvedSecondary.join()]);

  // If SVG asset isn't available, show a simple text fallback
  if (!muscleSvg) {
    const allMuscles = [...primary, ...secondary];
    if (!allMuscles.length) return null;
    return (
      <div style={{ ...muscleMapStyles.wrap, textAlign: 'left' }}>
        {primary.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>Primary: </span>
            <span style={{ fontSize: 13, color: '#374151' }}>{primary.join(', ')}</span>
          </div>
        )}
        {secondary.length > 0 && (
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fb923c' }}>Secondary: </span>
            <span style={{ fontSize: 13, color: '#374151' }}>{secondary.join(', ')}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={muscleMapStyles.wrap}>
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: muscleSvg }}
        style={{ width: '100%' }}
      />
      <div style={muscleMapStyles.legend}>
        <div style={muscleMapStyles.legendItem}>
          <div style={{ ...muscleMapStyles.legendDot, background: '#ef4444' }} />
          <span>Primary</span>
        </div>
        <div style={muscleMapStyles.legendItem}>
          <div style={{ ...muscleMapStyles.legendDot, background: '#fb923c' }} />
          <span>Secondary</span>
        </div>
        <div style={muscleMapStyles.legendItem}>
          <div style={{ ...muscleMapStyles.legendDot, background: 'rgba(180,185,196,0.55)' }} />
          <span>Inactive</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────

/**
 * ExerciseInfo
 *
 * Props:
 *   exercise : { name, instructions: { hints, breathing, muscles: { primary, secondary } } }
 *   onClose  : () => void
 *
 * Rendered via createPortal to document.body — escapes any parent
 * overflow:hidden or stacking context (e.g. ExerciseCard's dark page).
 */
export default function ExerciseInfo({ exercise, onClose }) {
  if (!exercise) return null;

  const instructions = exercise.instructions || {};
  const hints        = instructions.hints    || 'Focus on good form throughout.';
  const breathing    = instructions.breathing || 'Breathe steadily throughout the movement.';
  const muscles      = instructions.muscles   || { primary: [], secondary: [] };

  const content = (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div style={styles.handle} />

        {/* Header */}
        <div style={styles.header}>
          <div>
            <p style={styles.label}>Exercise Guide</p>
            <h2 style={styles.title}>{exercise.name}</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={styles.scrollArea}>

          {/* Hints */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={{ ...styles.sectionIcon, background: '#eff6ff' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#2563eb" strokeWidth="1.3"/>
                  <circle cx="8" cy="5.5" r="1" fill="#2563eb"/>
                  <path d="M8 8v4" stroke="#2563eb" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={styles.sectionTitle}>Form Tips</h3>
            </div>
            <div style={styles.hintCard}>
              <p style={styles.hintText}>{hints}</p>
            </div>
          </div>

          {/* Breathing */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={{ ...styles.sectionIcon, background: '#f0fdf4' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2c-1 2-3.5 3.5-3.5 6a3.5 3.5 0 007 0C11.5 5.5 9 4 8 2z"
                    stroke="#84cc16" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M6 10.5c0 1.1.9 2 2 2s2-.9 2-2" stroke="#84cc16" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={styles.sectionTitle}>Breathing</h3>
            </div>
            <div style={{ ...styles.hintCard, borderLeftColor: '#84cc16', background: '#f0fdf4' }}>
              <p style={styles.hintText}>{breathing}</p>
            </div>
          </div>

          {/* Muscle map */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={{ ...styles.sectionIcon, background: '#fff1f2' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2a3 3 0 013 3c0 2-2 3-3 5-1-2-3-3-3-5a3 3 0 013-3z"
                    stroke="#ef4444" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M5 11c-1.5.5-2 1.5-2 2.5h10c0-1-.5-2-2-2.5" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={styles.sectionTitle}>Muscles Worked</h3>
            </div>
            <MuscleMap
              primary={muscles.primary || []}
              secondary={muscles.secondary || []}
            />
          </div>

        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  // Portal renders directly into document.body — escapes any parent
  // overflow:hidden, stacking context, or z-index constraints
  return createPortal(content, document.body);
}

// ─── Styles ───────────────────────────────────────────────────

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 430,
    background: 'white',
    borderRadius: '24px 24px 0 0',
    maxHeight: '88vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideUp 0.3s ease',
  },
  handle: {
    width: 36,
    height: 4,
    background: '#e5e7eb',
    borderRadius: 2,
    margin: '14px auto 0',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '16px 20px 12px',
    flexShrink: 0,
    borderBottom: '1px solid #f3f4f6',
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    margin: '0 0 4px',
    fontFamily: "'Figtree', sans-serif",
  },
  title: {
    fontSize: 22,
    fontWeight: 900,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.3px',
    fontFamily: "'Figtree', sans-serif",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#f3f4f6',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: 4,
  },
  scrollArea: {
    overflowY: 'auto',
    padding: '4px 20px 40px',
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    fontFamily: "'Figtree', sans-serif",
  },
  hintCard: {
    background: '#f8fafc',
    borderRadius: 12,
    padding: '14px 16px',
    borderLeft: '3px solid #2563eb',
  },
  hintText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: 500,
    margin: 0,
    lineHeight: 1.6,
    fontFamily: "'Figtree', sans-serif",
  },
};

const muscleMapStyles = {
  wrap: {
    background: '#f8fafc',
    borderRadius: 14,
    padding: '12px 16px 16px',
    fontFamily: "'Figtree', sans-serif",
  },
  legend: {
    display: 'flex',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #e5e7eb',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 500,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
};
