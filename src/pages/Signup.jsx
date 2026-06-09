import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signUpWithEmail } from '../services/firebase';

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Google Sign-In ──
  // After signInWithGoogle resolves, onAuthChange in App.jsx
  // fires automatically and handles the redirect. No manual navigate needed.
  async function handleGoogle() {
    setGoogleLoading(true);
    setErrors({});
    try {
      await signInWithGoogle();
      // onAuthChange takes over from here
    } catch (err) {
      setErrors({ general: 'Google sign-in failed. Please try again.' });
      setGoogleLoading(false);
    }
  }

  // ── Validation ──
  function validate() {
    const e = {};
    if (!name.trim() || name.trim().length < 2)
      e.name = 'Please enter your name (at least 2 characters)';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Please enter a valid email address';
    if (!password || password.length < 6)
      e.password = 'Password must be at least 6 characters';
    if (password !== confirm)
      e.confirm = 'Passwords do not match';
    return e;
  }

  // ── Email Sign-Up ──
  // Same pattern — after signUpWithEmail, onAuthChange fires and redirects.
  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await signUpWithEmail(email.trim(), password);
      // Navigate to "/" — AuthGate mounts, checks profile, redirects correctly
      navigate('/', { replace: true });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setErrors({ email: 'An account with this email already exists. Try logging in.' });
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f2f2f7',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 24px 40px',
      fontFamily: 'Figtree, sans-serif',
      maxWidth: 390,
      margin: '0 auto',
    }}>

      {/* Back button */}
      <div style={{ paddingTop: 56, marginBottom: 32 }}>
        <button
          onClick={() => navigate('/welcome')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontSize: 15,
            color: '#475569',
            fontFamily: 'Figtree, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Back
        </button>
      </div>

      {/* Heading */}
      <h1 style={{
        fontSize: 28,
        fontWeight: 800,
        color: '#0f172a',
        margin: '0 0 8px',
        letterSpacing: '-0.5px',
      }}>
        Create Account
      </h1>
      <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 32px' }}>
        Start your fitness journey today.
      </p>

      {/* General error */}
      {errors.general && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 14,
          color: '#dc2626',
        }}>
          {errors.general}
        </div>
      )}

      {/* Google Button */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        style={{
          width: '100%',
          padding: '15px',
          background: '#fff',
          border: '1.5px solid #e2e8f0',
          borderRadius: 16,
          fontSize: 15,
          fontWeight: 600,
          color: '#0f172a',
          cursor: 'pointer',
          fontFamily: 'Figtree, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 24,
          opacity: googleLoading ? 0.7 : 1,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        {googleLoading ? 'Signing in...' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
      }}>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        <span style={{ fontSize: 13, color: '#94a3b8' }}>or</span>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      </div>

      {/* Form fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>

        <div>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle(!!errors.name)}
          />
          {errors.name && <p style={errorTextStyle}>{errors.name}</p>}
        </div>

        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle(!!errors.email)}
          />
          {errors.email && <p style={errorTextStyle}>{errors.email}</p>}
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle(!!errors.password)}
          />
          {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
        </div>

        <div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            style={inputStyle(!!errors.confirm)}
          />
          {errors.confirm && <p style={errorTextStyle}>{errors.confirm}</p>}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || googleLoading}
        style={{
          width: '100%',
          padding: '16px',
          background: loading ? '#cbd5e1' : '#2563eb',
          border: 'none',
          borderRadius: 16,
          fontSize: 16,
          fontWeight: 700,
          color: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'Figtree, sans-serif',
          marginBottom: 20,
        }}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      {/* Login link */}
      <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', margin: 0 }}>
        Already have an account?{' '}
        <span
          onClick={() => navigate('/login')}
          style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
        >
          Log In
        </span>
      </p>

    </div>
  );
}

function inputStyle(hasError) {
  return {
    width: '100%',
    padding: '14px 16px',
    background: '#fff',
    border: `1.5px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
    borderRadius: 14,
    fontSize: 15,
    color: '#0f172a',
    fontFamily: 'Figtree, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  };
}

const errorTextStyle = {
  margin: '6px 0 0 4px',
  fontSize: 13,
  color: '#ef4444',
};
