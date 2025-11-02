import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        ...styles.card,
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 10px 24px rgba(0,0,0,0.12)'
          : '0 6px 16px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <img
        src={product.image}
        alt={product.name}
        style={styles.image}
        onError={(e) => {
          if (!e.target.dataset.fallback) {
            e.target.dataset.fallback = '1';
            e.target.src = 'https://via.placeholder.com/600x400?text=Image+Unavailable';
          }
        }}
      />
      <div style={styles.body}>
        <h3 style={{
          ...styles.title,
          color: hover ? '#111827' : '#1f2937'
        }}>{product.name}</h3>
        {product.store && <div style={styles.store}>{product.store}</div>}
        <p style={styles.desc} title={product.description}>{product.description}</p>
        <div style={styles.row}>
          <span style={styles.price}>₱{product.price.toFixed(2)}</span>
          <button
            style={styles.btn}
            onClick={(e) => { e.stopPropagation(); addItem(product); }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer'
  },
  image: { width: '100%', height: 200, objectFit: 'cover', aspectRatio: '1 / 1' },
  body: { padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  title: { margin: 0, fontSize: 16, transition: 'color .15s ease' },
  store: { margin: 0, color: '#6b7280', fontSize: 12 },
  desc: {
    margin: 0,
    color: '#4b5563',
    fontSize: 13,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontWeight: 700 },
  btn: {
    background: '#16a34a',
    border: 'none',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer'
  }
};
