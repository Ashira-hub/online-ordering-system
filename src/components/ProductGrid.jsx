import React, { useEffect, useState } from 'react';
import api from '../data/api';
import ProductCard from './ProductCard';

export default function ProductGrid({ q = '', priceMin = '', priceMax = '', storeFilter = 'all' }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products', { params: { limit: 50, offset: 0 } })
      .then(res => {
        const normalized = (res.data || []).map(p => ({
          id: String(p.id),
          name: p.title,
          image: Array.isArray(p.images) ? p.images[0] : p.images,
          description: p.description,
          price: Number(p.price) || 0,
        }));
        setProducts(normalized);
      })
      .catch(err => console.error('Error fetching products:', err));
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '20px' }}>
      {products
        .filter(product => {
          if (q) {
            const needle = q.toLowerCase();
            const hay = `${product.name || ''} ${product.description || ''}`.toLowerCase();
            if (!hay.includes(needle)) return false;
          }
          if (priceMin !== '' && Number.isFinite(Number(priceMin)) && product.price < Number(priceMin)) return false;
          if (priceMax !== '' && Number.isFinite(Number(priceMax)) && product.price > Number(priceMax)) return false;
          return true;
        })
        .map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
    </div>
  );
}
