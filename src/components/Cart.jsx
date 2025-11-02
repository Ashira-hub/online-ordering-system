import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { createPaypalOrder, capturePaypalOrder } from '../lib/paypalApi';

export default function Cart() {
  const { items, setQty, removeItem, clear, subtotal, count } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const list = Object.values(items);

  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [authWarn, setAuthWarn] = useState(false);

  const handleCheckout = () => {
    if (!list.length) return;
    if (!isAuthenticated) {
      setAuthWarn(true);
      return;
    }
    setIsOpen(true);
  };

  // Auto-open checkout modal when URL contains ?checkout=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('checkout')) {
      handleCheckout();
    }
    // Handle PayPal return/cancel
    if (params.get('paypalReturn')) {
      const token = params.get('token'); // PayPal returns order ID in 'token'
      if (token) {
        // Guard: avoid duplicate captures on refresh/back-navigation
        const guardKey = `pp_done_${token}`;
        if (sessionStorage.getItem(guardKey)) {
          navigate(window.location.pathname, { replace: true });
          return;
        }
        (async () => {
          try {
            const cap = await capturePaypalOrder(token);
            const payer = cap?.payer;
            const given = payer?.name?.given_name || '';
            const surname = payer?.name?.surname || '';
            // Try to extract capture details
            const unit = cap?.purchase_units?.[0];
            const capture = unit?.payments?.captures?.[0];
            const txnId = capture?.id || cap?.id || token;
            const amount = capture?.amount?.value;
            const currency = capture?.amount?.currency_code;
            const displayAmount = amount ? `${currency || 'PHP'} ${amount}` : `₱${(subtotal || 0).toFixed(2)}`;
            alert(`PayPal payment successful!\nTransaction: ${txnId}\nPayer: ${[given, surname].filter(Boolean).join(' ')}\nAmount: ${displayAmount}`);
            sessionStorage.setItem(guardKey, '1');
            setIsOpen(false);
            clear();
          } catch (e) {
            console.error('PayPal capture failed:', e);
            // If already captured, treat as success
            try {
              const parsed = e?.message && JSON.parse(e.message);
              const issue = parsed?.details?.[0]?.issue;
              if (issue === 'ORDER_ALREADY_CAPTURED') {
                sessionStorage.setItem(guardKey, '1');
                alert('Payment was already captured. Thank you!');
                setIsOpen(false);
                clear();
              } else {
                alert(`Failed to capture PayPal payment${e?.message ? `: ${e.message}` : ''}`);
              }
            } catch {
              alert(`Failed to capture PayPal payment${e?.message ? `: ${e.message}` : ''}`);
            }
          } finally {
            // remove query params
            navigate(window.location.pathname, { replace: true });
          }
        })();
      }
    } else if (params.get('paypalCancel')) {
      // Clean up URL on cancel
      navigate(window.location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, list.length, isAuthenticated]);

  const handlePayPal = async () => {
    try {
      setError('');
      // Prepare line items for notification receipt on the server
      const lineItems = list.map(({ product, qty }) => ({
        id: product.id,
        name: product.name,
        store: product.store,
        price: product.price.toFixed(2),
        qty,
        total: (product.price * qty).toFixed(2),
        currency: 'PHP'
      }));
      const { approveUrl } = await createPaypalOrder({
        currency: 'PHP',
        value: subtotal.toFixed(2),
        description: 'Online Order',
        returnUrl: `${window.location.origin}/?paypalReturn=1`,
        cancelUrl: `${window.location.origin}/?paypalCancel=1`,
        items: lineItems,
        brandName: 'Test Store',
        locale: 'en-PH',
        shippingPreference: 'GET_FROM_FILE'
      });
      if (approveUrl) {
        window.location.href = approveUrl;
      } else {
        setError('Failed to get PayPal approval link');
      }
    } catch (e) {
      setError(e?.message || 'Failed to start PayPal payment');
    }
  };

  return (
    <aside style={styles.wrap}>
      <h2 style={styles.heading}>Your Cart ({count} {count === 1 ? 'item' : 'items'})</h2>
      {!list.length && <p style={styles.empty}>Your cart is empty.</p>}
      {authWarn && (
        <div style={styles.authWarn}>
          <div>
            <strong>Sign in required</strong>
            <div style={{ fontSize: 13, color: '#374151' }}>Please login to proceed to payment.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={styles.loginInlineBtn} onClick={() => navigate('/login')}>Login</button>
            <button style={styles.dismissBtn} onClick={() => setAuthWarn(false)}>Dismiss</button>
          </div>
        </div>
      )}
      <div style={styles.list}>
        {list.map(({ product, qty }) => (
          <div key={product.id} style={styles.item}>
            <img src={product.image} alt={product.name} style={styles.thumb} />
            <div style={styles.meta}>
              <div style={styles.rowTop}>
                <strong>{product.name}</strong>
                <span>₱{(product.price * qty).toFixed(2)}</span>
              </div>
              <div style={styles.rowBottom}>
                <div style={styles.qtyBox}>
                  <button onClick={() => setQty(product.id, qty - 1)} style={styles.qtyBtn}>-</button>
                  <input
                    style={styles.qtyInput}
                    type="number"
                    min={0}
                    value={qty}
                    onChange={(e) => setQty(product.id, parseInt(e.target.value || '0', 10))}
                  />
                  <button onClick={() => setQty(product.id, qty + 1)} style={styles.qtyBtn}>+</button>
                </div>
                <button onClick={() => removeItem(product.id)} style={styles.removeBtn}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={styles.footer}>
        <div><strong>Subtotal:</strong> ₱{subtotal.toFixed(2)}</div>
        <button disabled={!list.length} onClick={handleCheckout} style={styles.checkoutBtn}>
          Checkout
        </button>
      </div>

      {isOpen && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="payment-title">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 id="payment-title" style={{ margin: 0 }}>Payment</h3>
              <button onClick={() => setIsOpen(false)} style={styles.closeBtn} aria-label="Close">×</button>
            </div>
            <div style={styles.form}>
              {error && <div style={styles.error}>{error}</div>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><strong>Total</strong></div>
                <div style={{ fontWeight: 800 }}>₱{subtotal.toFixed(2)}</div>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setIsOpen(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="button" onClick={handlePayPal} style={styles.paypalBtn}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M7.5 21H5.3a1 1 0 0 1-1-.86L3 13.5C2.83 12.38 3.72 11.4 4.85 11.4H9c3.6 0 6.7-1.25 7.2-5.02C16.6 3.3 14.77 2 12.34 2H7.15A2.15 2.15 0 0 0 5.05 3.78L2.5 20.1A1 1 0 0 0 3.48 21h3.16l.86-6h2.1l-.1.67L8.5 21h-.99zm13.5-9.6c-.5 3.77-3.58 5.02-7.18 5.02h-2.2l-.62 4.35a1 1 0 0 0 .99 1.15h2.18c.46 0 .85-.33.93-.78l.05-.27.53-3.45.03-.15c.08-.45.47-.78.93-.78h.59c2.38 0 4.24-.97 4.77-3.77.23-1.2.08-2.19-.49-2.93-.75-.98-2.08-1.57-3.76-1.57h-1.7c.46.8.6 1.77.45 2.88z"/>
                    </svg>
                    Pay with PayPal
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

const styles = {
  wrap: {
    background: '#f9fafb',
    borderLeft: '1px solid #e5e7eb',
    minWidth: 320,
    maxWidth: 380,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    height: 'calc(100vh - 56px)',
    position: 'sticky',
    top: 56,
    overflowY: 'auto'
  },
  heading: { margin: 0 },
  empty: { color: '#6b7280', margin: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  item: { display: 'flex', gap: 12, background: '#fff', borderRadius: 8, padding: 10, alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  thumb: { width: 64, height: 64, objectFit: 'cover', borderRadius: 8 },
  meta: { flex: 1 },
  rowTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  rowBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  qtyBox: { display: 'flex', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' },
  qtyInput: { width: 48, textAlign: 'center', padding: 4, border: '1px solid #d1d5db', borderRadius: 6 },
  removeBtn: { background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' },
  footer: { marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  checkoutBtn: { background: '#111827', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' },
  authWarn: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', padding: '10px 12px', borderRadius: 8 },
  loginInlineBtn: { background: '#111827', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' },
  dismissBtn: { background: 'transparent', color: '#9a3412', border: '1px solid #fdba74', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { background: '#fff', borderRadius: 10, width: '100%', maxWidth: 420, padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  closeBtn: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 },
  inlineFields: { display: 'flex', gap: 10 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { background: '#e5e7eb', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' },
  payBtn: { background: '#16a34a', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' },
  paypalBtn: { background: '#0070ba', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '8px 10px', borderRadius: 8 }
};
