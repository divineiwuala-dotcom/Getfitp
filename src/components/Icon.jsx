import React from 'react';

export default function Icon({ name, size = 20, className, style }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };

  const icons = {
    fire: (
      <svg {...common} className={className} style={style}>
        <path d="M12 2s2.5 3 2.5 5.5S12 11 12 11s-2.5-1.9-2.5-3.5S12 2 12 2z" fill="currentColor" />
        <path d="M12 13.5c4 0 6 2.5 6 4.5 0 1.9-2.7 3-6 3s-6-1.1-6-3c0-2 2-4.5 6-4.5z" fill="currentColor" opacity="0.9" />
      </svg>
    ),
    lightning: (
      <svg {...common} className={className} style={style}>
        <path d="M13 2L3 14h7l-1 8L21 10h-7l-0.999-8z" fill="currentColor" />
      </svg>
    ),
    biceps: (
      <svg {...common} className={className} style={style}>
        <path d="M4 12c0-1.1.9-2 2-2h2v6H6c-1.1 0-2-.9-2-2v-2z" fill="currentColor" />
        <path d="M14 6h2a2 2 0 0 1 2 2v6h-4V6z" fill="currentColor" />
      </svg>
    ),
    runner: (
      <svg {...common} className={className} style={style}>
        <path d="M13 5a2 2 0 1 0-2-2 2 2 0 0 0 2 2z" fill="currentColor" />
        <path d="M4 20l4-1 3-6 3 1 2 3 3 3v1H4z" fill="currentColor" opacity="0.9" />
      </svg>
    ),
    seedling: (
      <svg {...common} className={className} style={style}>
        <path d="M12 2s4 3 4 6a4 4 0 0 1-8 0c0-3 4-6 4-6z" fill="currentColor" />
        <path d="M6 20s2-6 10-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    sparkle: (
      <svg {...common} className={className} style={style}>
        <path d="M12 2l1.5 3L17 7l-3.5 1L12 11l-1.5-3L7 7l3.5-2L12 2z" fill="currentColor" />
      </svg>
    ),
    trophy: (
      <svg {...common} className={className} style={style}>
        <path d="M6 3h12v2a4 4 0 0 1-4 4H10A4 4 0 0 1 6 5V3z" fill="currentColor" />
        <path d="M8 11v2a4 4 0 0 0 4 4v3h0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    stopwatch: (
      <svg {...common} className={className} style={style}>
        <circle cx="12" cy="13" r="6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 2h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 11v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    alarm: (
      <svg {...common} className={className} style={style}>
        <path d="M4 6l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M20 6l-2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="13" r="6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
    clock: (
      <svg {...common} className={className} style={style}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    dumbbell: (
      <svg {...common} className={className} style={style}>
        <rect x="2" y="9" width="4" height="6" rx="1" fill="currentColor" />
        <rect x="18" y="9" width="4" height="6" rx="1" fill="currentColor" />
        <rect x="7" y="11" width="10" height="2" rx="1" fill="currentColor" />
      </svg>
    ),
    clipboard: (
      <svg {...common} className={className} style={style}>
        <path d="M9 2h6v2H9z" fill="currentColor" />
        <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    ),
    clapper: (
      <svg {...common} className={className} style={style}>
        <rect x="3" y="8" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M3 8l4-4 4 4 4-4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    idea: (
      <svg {...common} className={className} style={style}>
        <path d="M9 18h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 2a5 5 0 0 0-3 9v1h6v-1a5 5 0 0 0-3-9z" fill="currentColor" />
      </svg>
    ),
    party: (
      <svg {...common} className={className} style={style}>
        <path d="M12 2l1.5 3L17 7l-3.5 1L12 11l-1.5-3L7 7l3.5-2L12 2z" fill="currentColor" />
      </svg>
    ),
    rocket: (
      <svg {...common} className={className} style={style}>
        <path d="M2 22s4-1 6-3 3-6 3-6 3 1 6 3 3 6 3 6-4 1-6 3-3 6-3 6-3-1-6-3S2 22 2 22z" fill="currentColor" />
      </svg>
    ),
    check: (
      <svg {...common} className={className} style={style}>
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    checkmark: (
      <svg {...common} className={className} style={style}>
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    cross: (
      <svg {...common} className={className} style={style}>
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    chevronDown: (
      <svg {...common} className={className} style={style}>
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    chevronRight: (
      <svg {...common} className={className} style={style}>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    arrowLeft: (
      <svg {...common} className={className} style={style}>
        <path d="M15 6L9 12l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    clipboardAlt: (
      <svg {...common} className={className} style={style}>
        <rect x="7" y="3" width="10" height="4" rx="1" fill="currentColor" />
        <rect x="5" y="7" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    ),
    calendar: (
      <svg {...common} className={className} style={style}>
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M16 2v4M8 2v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  };

  return icons[name] || (
    <svg {...common} className={className} style={style}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
