import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f2f2f7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: 'Figtree, sans-serif',
    }}>

      {/* Logo / App name */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 72,
          height: 72,
          background: '#2563eb',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <span style={{ fontSize: 32 }}>💪</span>
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 0 12px',
          letterSpacing: '-0.5px',
        }}>
          GetFit
        </h1>

        <p style={{
          fontSize: 16,
          color: '#64748b',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Your AI coach that grows with you.
        </p>
      </div>

      {/* Buttons */}
      <div style={{
        width: '100%',
        maxWidth: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>

        {/* Primary CTA */}
        <button
          onClick={() => navigate('/signup')}
          style={{
            width: '100%',
            padding: '16px',
            background: '#84cc16',
            border: 'none',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            color: '#0f172a',
            cursor: 'pointer',
            fontFamily: 'Figtree, sans-serif',
          }}
        >
          Get Started
        </button>

        {/* Secondary */}
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            padding: '16px',
            background: 'transparent',
            border: '1.5px solid #cbd5e1',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
            fontFamily: 'Figtree, sans-serif',
          }}
        >
          I already have an account
        </button>
      </div>

    </div>
  );
}
