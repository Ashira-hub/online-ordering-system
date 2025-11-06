import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../data/api';
import { useCart } from '../components/CartContext';

export default function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [payOpen, setPayOpen] = useState(false);
  const [form, setForm] = useState({ name: '', card: '', exp: '', cvv: '' });
  const [error, setError] = useState('');

  const [product, setProduct] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        if (!active) return;
        const p = res.data;
        const normalized = {
          id: String(p.id),
          name: p.title,
          image: Array.isArray(p.images) ? p.images[0] : p.images,
          description: p.description,
          price: Number(p.price) || 0,
        };
        setProduct(normalized);
      } catch (_e) {
        setProduct(null);
      }
    };
    load();
    return () => { active = false; };
  }, [id]);

  if (!product) {
    return (
      <div style={styles.wrap}>
        <div style={styles.panel}>
          <h1 style={{ marginTop: 0 }}>Product not found</h1>
          <button style={styles.backBtn} onClick={() => navigate('/')}>Back to Products</button>
        </div>
      </div>
    );
  }

  const addToCart = () => {
    if (!product) return;
    for (let i = 0; i < Math.max(1, qty); i++) addItem(product);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    const digits = form.card.replace(/\D/g, '');
    if (digits.length < 12) return 'Card number looks invalid';
    if (!/^\d{2}\/\d{2}$/.test(form.exp)) return 'Expiry must be MM/YY';
    if (!/^\d{3,4}$/.test(form.cvv)) return 'CVV must be 3-4 digits';
    return '';
  };

  const handlePay = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    const total = (product.price * qty).toFixed(2);
    alert(`Payment successful! Paid $${total}. Thank you, ${form.name}.`);
    setPayOpen(false);
    setForm({ name: '', card: '', exp: '', cvv: '' });
    setError('');
    navigate('/');
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.headerTop}>
        <div style={styles.breadcrumb}>
          <button style={styles.crumbBtn} onClick={() => navigate('/')}>Products</button>
          <span style={{ opacity: 0.6 }}> / </span>
          <span style={{ color: '#111827' }}>{product?.name || '...'}</span>
        </div>
        <button style={styles.topRightBackBtn} onClick={() => navigate(-1)}>Back</button>
      </div>

      <div style={styles.layout}>
        <div style={styles.mediaCol}>
          <div style={styles.mediaBox}>
            <img
              src={product?.image}
              alt={product?.name || ''}
              style={styles.hero}
              onError={(e) => {
                if (!e.target.dataset.fallback) {
                  e.target.dataset.fallback = '1';
                  e.target.src = 'https://via.placeholder.com/600x400?text=Image+Unavailable';
                }
              }}
            />
          </div>
        </div>

        <div style={styles.infoCol}>
          <div style={styles.headerRow}>
            <span style={styles.badge}>Popular</span>
            <div style={styles.rating}>
              <span style={{ color: '#f59e0b' }}>★★★★★</span>
              <span style={{ color: '#6b7280', marginLeft: 6 }}>(124)</span>
            </div>
          </div>

          <h1 style={styles.title}>{product?.name || '...'}</h1>
          {product?.store && <div style={styles.storeLine}>{product.store}</div>}
          <div style={styles.priceRow}>
            <span style={styles.price}>${(product?.price ?? 0).toFixed(2)}</span>
            <span style={styles.ship}>Free shipping</span>
          </div>

          <p style={styles.desc}>{product?.description}</p>

          <div style={styles.controls}>
            <div style={styles.qtyBox}>
              <button style={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
              <input
                style={styles.qtyInput}
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || '1', 10)))}
              />
              <button style={styles.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
            </div>
            <button style={styles.primaryCta} onClick={addToCart}>Add to Cart</button>
            <button style={styles.secondaryCta} onClick={() => setPayOpen(true)}>Buy Now</button>
          </div>

          <div style={styles.extra}> 
            <div style={styles.extraItem}>
              <strong>Return policy</strong>
              <span>30-day hassle-free returns</span>
            </div>
            <div style={styles.extraItem}>
              <strong>Secure payment</strong>
              <span>128-bit SSL encryption</span>
            </div>
            <div style={styles.extraItem}>
              <strong>Support</strong>
              <span>Chat with us 24/7</span>
            </div>
          </div>
        </div>
      </div>
      {payOpen && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="direct-payment-title">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 id="direct-payment-title" style={{ margin: 0 }}>Payment</h3>
              <button onClick={() => setPayOpen(false)} style={styles.closeBtn} aria-label="Close">×</button>
            </div>
            <form onSubmit={handlePay} style={styles.form}>
              {error && <div style={styles.error}>{error}</div>}
              <label style={styles.label}>
                Name on card
                <input style={styles.input} type="text" name="name" value={form.name} onChange={onChange} placeholder="Jane Doe" required />
              </label>
              <label style={styles.label}>
                Card number
                <input style={styles.input} type="text" name="card" value={form.card} onChange={onChange} placeholder="4111 1111 1111 1111" inputMode="numeric" />
              </label>
              <div style={styles.inlineFields}>
                <label style={{ ...styles.label, flex: 1 }}>
                  Expiry (MM/YY)
                  <input style={styles.input} type="text" name="exp" value={form.exp} onChange={onChange} placeholder="08/27" maxLength={5} />
                </label>
                <label style={{ ...styles.label, flex: 1 }}>
                  CVV
                  <input style={styles.input} type="password" name="cvv" value={form.cvv} onChange={onChange} placeholder="123" maxLength={4} inputMode="numeric" />
                </label>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setPayOpen(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.payBtn}>Pay ${(((product?.price ?? 0) * qty).toFixed(2))}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { padding: 16 },
  headerTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  breadcrumb: { display: 'flex', gap: 8, alignItems: 'center', color: '#6b7280' },
  crumbBtn: { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer' },

  layout: { display: 'grid', gridTemplateColumns: 'minmax(300px, 520px) 1fr', gap: 24, alignItems: 'start' },
  mediaCol: { position: 'sticky', top: 72 },
  mediaBox: { background: '#fff', borderRadius: 12, padding: 10, boxShadow: '0 6px 16px rgba(0,0,0,0.06)' },
  hero: { width: '100%', borderRadius: 10, objectFit: 'cover' },
  thumbRow: { display: 'flex', gap: 8, marginTop: 8 },
  thumb: { width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' },

  infoCol: { display: 'flex', flexDirection: 'column', gap: 12 },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  badge: { background: '#ecfeff', color: '#0891b2', padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 },
  rating: { display: 'flex', alignItems: 'center' },
  title: { margin: 0, fontSize: 28 },
  storeLine: { color: '#6b7280', fontSize: 14 },
  priceRow: { display: 'flex', alignItems: 'center', gap: 10 },
  price: { fontSize: 24, fontWeight: 800, color: '#111827' },
  ship: { color: '#10b981', fontWeight: 600 },
  desc: { color: '#4b5563', lineHeight: 1.6 },

  controls: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' },
  qtyBox: { display: 'flex', alignItems: 'center', gap: 6, background: '#fff', padding: 4, borderRadius: 10, border: '1px solid #e5e7eb' },
  qtyBtn: { width: 34, height: 34, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' },
  qtyInput: { width: 64, textAlign: 'center', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 },
  primaryCta: { background: '#111827', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
  secondaryCta: { background: '#e5e7eb', color: '#111827', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  topRightBackBtn: { background: 'transparent', color: '#2563eb', border: '1px solid #bfdbfe', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },

  extra: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 16 },
  extraItem: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }
  ,
  // modal styles (mirrored from Cart)
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 },
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
  error: { background: '#fee2e2', color: '#b91c1c', padding: '8px 10px', borderRadius: 8 }
};
