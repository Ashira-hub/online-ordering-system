import './App.css';
import { useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './components/CartContext';
import { AuthProvider } from './components/AuthContext';
import Navbar from './components/Navbar';
import ProductGrid from './components/ProductGrid';
import Cart from './components/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import AccountsAdmin from './pages/AccountsAdmin';
import ProductDetails from './pages/ProductDetails';
import products from './data/products';

function App() {
  const [storeFilter, setStoreFilter] = useState('all');
  const [q, setQ] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const stores = useMemo(() => {
    const exclude = new Set(['Crispy Bites', 'Pepperoni Plaza', 'Veggie Delight', 'Fry Shack', 'Pasta House', 'Taco Street']);
    const set = new Set(products.map(p => p.store).filter(Boolean).filter(name => !exclude.has(name)));
    return ['all', ...Array.from(set)];
  }, []);
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div style={styles.app}>
            <Navbar />
            <Routes>
              <Route
                path="/"
                element={
                  <main style={styles.main}>
                    <div style={styles.catalogArea}>
                      <div style={styles.topRow}>
                        <h1 style={styles.heading}>Products</h1>
                        <div style={styles.filterBar}>
                          <div style={styles.fieldGroup}>
                            <label style={styles.fieldLabel}>Search</label>
                            <div style={styles.fieldControl}>
                              <input
                                type="text"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Find meals, stores..."
                                style={styles.input}
                                aria-label="Search products"
                              />
                            </div>
                          </div>

                          <div style={{ ...styles.fieldGroup, minWidth: 240 }}>
                            <label style={styles.fieldLabel}>Price</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <div style={{ position: 'relative', flex: 1 }}>
                                <span style={styles.prefix}>$</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={priceMin}
                                  onChange={(e) => setPriceMin(e.target.value)}
                                  placeholder="Min"
                                  style={{ ...styles.input, paddingLeft: 24 }}
                                  aria-label="Minimum price"
                                />
                              </div>
                              <div style={{ position: 'relative', flex: 1 }}>
                                <span style={styles.prefix}>$</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={priceMax}
                                  onChange={(e) => setPriceMax(e.target.value)}
                                  placeholder="Max"
                                  style={{ ...styles.input, paddingLeft: 24 }}
                                  aria-label="Maximum price"
                                />
                              </div>
                            </div>
                          </div>

                          <div style={styles.fieldGroup}>
                            <label style={styles.fieldLabel}>Store</label>
                            <div style={styles.fieldControl}>
                              <select
                                aria-label="Filter by store"
                                value={storeFilter}
                                onChange={(e) => setStoreFilter(e.target.value)}
                                style={styles.select}
                              >
                                {stores.map((s) => (
                                  <option key={s} value={s}>
                                    {s === 'all' ? 'All stores' : s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                              type="button"
                              style={styles.clearBtn}
                              onClick={() => { setQ(''); setPriceMin(''); setPriceMax(''); setStoreFilter('all'); }}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                      <ProductGrid storeFilter={storeFilter} q={q} priceMin={priceMin} priceMax={priceMax} />
                    </div>
                    <Cart />
                  </main>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/accounts" element={<AccountsAdmin />} />
              <Route
                path="/product/:id"
                element={
                  <main style={styles.main}>
                    <div style={styles.catalogArea}>
                      <ProductDetails />
                    </div>
                    <Cart />
                  </main>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = {
  app: { minHeight: '100vh', background: '#f3f4f6' },
  main: { display: 'flex', alignItems: 'flex-start' },
  catalogArea: { flex: 1 },
  heading: { fontSize: 24, margin: 0 },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  filterBar: { background: 'transparent', padding: 10, borderRadius: 10, display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: { fontSize: 12, color: '#6b7280' },
  fieldControl: { display: 'flex' },
  select: { padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 },
  prefix: { position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' },
  clearBtn: { background: '#e5e7eb', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' },
};

export default App;
