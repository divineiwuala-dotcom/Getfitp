import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const HomeIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ChatIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);

const ProgressIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { label: 'Home', icon: HomeIcon, route: '/dashboard' },
    { label: 'Coach', icon: ChatIcon, route: '/chat' },
    { label: 'Progress', icon: ProgressIcon, route: '/progress' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(({ label, icon: Icon, route }) => {
        const active = path === route;
        return (
          <button
            key={route}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(route)}
          >
            <Icon filled={active} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
