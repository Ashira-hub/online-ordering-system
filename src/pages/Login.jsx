import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { verifyCredentials } from '../lib/accountDb';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email');
      return;
    }
    if (!form.password) {
      setError('Password is required');
      return;
    }
    const acct = verifyCredentials(form.email, form.password);
    if (!acct) {
      setError('Invalid email or password');
      return;
    }
    setError('');
    login(acct.email);
    // Fire-and-forget login notification (do not block UI)
    try {
      const base = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
      fetch(`${base}/api/notify/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acct.email })
      }).catch(() => {});
    } catch {}
    navigate('/');
  };

  return (
    <div style={styles.wrap}>
      <form onSubmit={onSubmit} style={styles.form}>
        <h1 style={{ margin: 0 }}>Login</h1>
        {error && <div style={styles.error}>{error}</div>}
        <label style={styles.label}>
          Email
          <input
            style={styles.input}
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            required
          />
        </label>
        <label style={styles.label}>
          Password
          <input
            style={styles.input}
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="••••••••"
            required
          />
        </label>
        <button type="submit" style={styles.submit}>Login</button>
        <div style={styles.helper}>Don't have an account? <button type="button" onClick={() => navigate('/register')} style={styles.linkBtn}>Register</button></div>
      </form>
    </div>
  );
}

const styles = {
  wrap: { minHeight: 'calc(100vh - 56px)', display: 'grid', placeItems: 'center', padding: 16 },
  form: { width: '100%', maxWidth: 360, background: '#fff', padding: 20, borderRadius: 10, boxShadow: '0 6px 16px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 12 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 },
  submit: { background: '#111827', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '8px 10px', borderRadius: 8 },
  helper: { color: '#6b7280', fontSize: 13, textAlign: 'center' },
  linkBtn: { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0 }
};
