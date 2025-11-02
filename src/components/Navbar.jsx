import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav style={styles.nav}>
      <button
        style={styles.brand}
        onClick={() => navigate('/')}
        aria-label="Go to home"
      >
        Online Ordering
      </button>
      <div style={styles.right}>
        {isAuthenticated ? (
          <>
            <button
              style={styles.iconBtn}
              aria-label="Notifications"
              title="Notifications"
              onClick={() => navigate('/notifications')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>
              </svg>
            </button>
            <div style={styles.userPill} title={user?.email}>
              {user?.name || user?.email}
            </div>
            <button
              style={styles.logoutBtn}
              onClick={() => { logout(); navigate('/'); }}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            style={styles.loginBtn}
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: '#111827',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: 0
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 16
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 999,
    background: '#1f2937',
    color: '#fff',
    border: '1px solid #374151',
    cursor: 'pointer'
  },
  loginBtn: {
    background: '#ffffff',
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600
  },
  logoutBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600
  },
  userPill: {
    background: '#2563eb',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    maxWidth: 220,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
};
