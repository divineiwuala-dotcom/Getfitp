import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './index.css';

import BottomNav        from './components/BottomNav';
import Onboarding       from './pages/Onboarding';
import Dashboard        from './pages/Dashboard';
import ActiveWorkout    from './pages/ActiveWorkout';
import Progress         from './pages/Progress';
import Chat             from './pages/Chat';
import HowAreYouFeeling from './pages/HowAreYouFeeling';
import SessionSetup     from './pages/SessionSetup';
import DayComplete      from './pages/DayComplete';
import Welcome          from './pages/Welcome';
import Signup           from './pages/Signup';
import Login            from './pages/Login';

import { onAuthChange, getUserProfile } from './services/firebase';

// Wrapper that guarantees full-screen coverage — prevents Dashboard bleeding through
function FullScreen({ children }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: '#0f172a',
      overflowY: 'auto',
    }}>
      {children}
    </div>
  );
}

// Auth gate — listens to Firebase auth state and redirects accordingly
function AuthGate() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        // Force token propagation before Firestore read — fixes race condition
        // where auth.currentUser is set but Firestore SDK doesn't have the token yet
        try {
          await user.getIdToken();
          const profile = await getUserProfile();
          if (!profile) {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/feeling', { replace: true });
          }
        } catch {
          // getUserProfile failed — send to onboarding to be safe
          navigate('/onboarding', { replace: true });
        }
      } else {
        // Not logged in — show welcome screen
        navigate('/welcome', { replace: true });
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (checking) {
    return (
      <div style={{
        height: '100vh',
        background: '#f2f2f7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        fontFamily: 'Figtree, sans-serif',
        padding: '0 32px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div>
          <p style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 6px',
          }}>
            Setting up your profile...
          </p>
          <p style={{
            fontSize: 14,
            color: '#64748b',
            margin: 0,
            lineHeight: 1.5,
          }}>
            This may take a few seconds. Please don't close the app.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Root — AuthGate checks login state and redirects */}
        <Route path="/" element={<AuthGate />} />

        {/* Auth screens — no nav */}
        <Route path="/welcome"  element={<Welcome />} />
        <Route path="/signup"   element={<Signup />} />
        <Route path="/login"    element={<Login />} />

        {/* Onboarding — no nav */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Main app screens — with bottom nav */}
        <Route path="/dashboard" element={<><Dashboard /><BottomNav /></>} />
        <Route path="/progress"  element={<><Progress /><BottomNav /></>} />
        <Route path="/chat"      element={<Chat />} />

        {/* Morning flow screens — no nav, light background */}
        <Route path="/feeling" element={<HowAreYouFeeling />} />
        <Route path="/setup"   element={<SessionSetup />} />

        {/* Full screen workout — fixed overlay so nothing bleeds through */}
        <Route path="/workout/:mode" element={
          <FullScreen>
            <ActiveWorkout />
          </FullScreen>
        } />

        {/* Day complete screen — full screen, dark */}
        <Route path="/complete" element={
          <FullScreen>
            <DayComplete />
          </FullScreen>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
