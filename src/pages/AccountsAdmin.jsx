import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAccounts, deleteAccount, clearAccounts } from '../lib/accountDb';

export default function AccountsAdmin() {
  const navigate = useNavigate();
  const [list, setList] = useState(() => getAllAccounts());
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(a =>
      a.email.toLowerCase().includes(q) ||
      (a.name || '').toLowerCase().includes(q)
    );
  }, [list, query]);

  const remove = (id) => {
    const next = deleteAccount(id);
    setList(next);
  };

  const clearAll = () => {
    if (!window.confirm('This will remove ALL stored accounts. Continue?')) return;
    clearAccounts();
    setList([]);
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <h1 style={{ margin: 0 }}>Accounts</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            style={styles.search}
          />
          <button style={styles.secondaryBtn} onClick={() => navigate('/')}>Back</button>
          <button style={styles.dangerBtn} onClick={clearAll}>Clear All</button>
        </div>
      </div>

      {!filtered.length && (
        <div style={styles.empty}>No accounts found.</div>
      )}

      <div style={styles.table}>
        <div style={{ ...styles.row, ...styles.head }}>
          <div style={{ flex: 2 }}>Name</div>
          <div style={{ flex: 3 }}>Email</div>
          <div style={{ flex: 3 }}>Created</div>
          <div style={{ width: 120 }}>Actions</div>
        </div>
        {filtered.map(a => (
          <div key={a.id} style={styles.row}>
            <div style={{ flex: 2 }}>{a.name || '—'}</div>
            <div style={{ flex: 3 }}>{a.email}</div>
            <div style={{ flex: 3 }}>{new Date(a.createdAt).toLocaleString()}</div>
            <div style={{ width: 120 }}>
              <button style={styles.dangerBtn} onClick={() => remove(a.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: { padding: 16 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  search: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8 },
  empty: { background: '#f3f4f6', border: '1px dashed #d1d5db', padding: 16, borderRadius: 8, color: '#6b7280' },
  table: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: { display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  head: { fontWeight: 700, background: '#f9fafb' },
  secondaryBtn: { background: '#e5e7eb', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' },
  dangerBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }
};
