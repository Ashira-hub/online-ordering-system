// Simple client helper for our PayPal API
// Ensure the server is running (npm run server) on http://localhost:4000

// Resolve API base across Vite and CRA, local and deployed
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost'
    ? 'http://localhost:4000'
    : (typeof window !== 'undefined' && window.location && window.location.origin) || '');

export async function createPaypalOrder({ currency = 'USD', value, description, returnUrl, cancelUrl, items, brandName, locale, shippingPreference }) {
  const res = await fetch(`${API_BASE}/api/paypal/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency, value, description, returnUrl, cancelUrl, items, brandName, locale, shippingPreference })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) : 'Failed to create PayPal order');
  return data; // { id }
}

export async function capturePaypalOrder(orderId) {
  const res = await fetch(`${API_BASE}/api/paypal/capture-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) : 'Failed to capture PayPal order');
  return data; // PayPal capture response
}
