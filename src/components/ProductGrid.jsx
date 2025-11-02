import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ sort = 'default', storeFilter = 'all', q = '', priceMin = '', priceMax = '' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const base = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
    const params = new URLSearchParams();
    if (storeFilter && storeFilter !== 'all') params.set('store', storeFilter);
    if (sort && sort !== 'default') params.set('sort', sort);
    if (q) params.set('q', q);
    if (priceMin !== '' && !Number.isNaN(Number(priceMin))) params.set('priceMin', String(priceMin));
    if (priceMax !== '' && !Number.isNaN(Number(priceMax))) params.set('priceMax', String(priceMax));
    const url = `${base}/api/products${params.toString() ? `?${params.toString()}` : ''}`;
    setLoading(true);
    setError('');
    fetch(url)
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data.items) ? data.items : []))
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  }, [sort, storeFilter, q, priceMin, priceMax]);

  return (
    <div style={styles.container}>
      {error && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</div>}
      <div style={styles.grid}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
        ) : (
          items.map(p => (
            <ProductCard key={p.id} product={p} />
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: 16
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16
  }
};
