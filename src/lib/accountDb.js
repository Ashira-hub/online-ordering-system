// Simple localStorage-backed account database (demo only)
// In production, use a real backend and hash passwords.

const KEY = 'demo_accounts';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAllAccounts() {
  return readAll();
}

export function getAccountByEmail(email) {
  return readAll().find(a => a.email.toLowerCase() === String(email).toLowerCase()) || null;
}

export function createAccount({ name, email, password }) {
  const list = readAll();
  if (list.some(a => a.email.toLowerCase() === String(email).toLowerCase())) {
    throw new Error('Account with this email already exists');
  }
  const acct = {
    id: `u_${Date.now()}`,
    name,
    email,
    password, // WARNING: plaintext for demo only
    createdAt: new Date().toISOString()
  };
  list.push(acct);
  writeAll(list);
  return acct;
}

export function verifyCredentials(email, password) {
  const acct = getAccountByEmail(email);
  if (!acct) return null;
  if (acct.password !== password) return null;
  return acct;
}

export function deleteAccount(id) {
  const list = readAll();
  const next = list.filter(a => a.id !== id);
  writeAll(next);
  return next;
}

export function clearAccounts() {
  writeAll([]);
}
