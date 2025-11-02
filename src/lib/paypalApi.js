// Simple client helper for our PayPal API
// Ensure the server is running (npm run server) on http://localhost:4000

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

export async function createPaypalOrder({ currency = 'USD', value, description, returnUrl, cancelUrl, brandName, locale, shippingPreference }) {
  const res = await fetch(`${API_BASE}/api/paypal/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency, value, description, returnUrl, cancelUrl, brandName, locale, shippingPreference })
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
