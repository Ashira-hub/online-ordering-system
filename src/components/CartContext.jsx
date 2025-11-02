import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product } = action;
      const existing = state.items[product.id];
      const qty = existing ? existing.qty + 1 : 1;
      return {
        ...state,
        items: {
          ...state.items,
          [product.id]: { product, qty }
        }
      };
    }
    case 'REMOVE': {
      const { id } = action;
      const copy = { ...state.items };
      delete copy[id];
      return { ...state, items: copy };
    }
    case 'SET_QTY': {
      const { id, qty } = action;
      if (qty <= 0) {
        const copy = { ...state.items };
        delete copy[id];
        return { ...state, items: copy };
      }
      return {
        ...state,
        items: {
          ...state.items,
          [id]: { ...state.items[id], qty }
        }
      };
    }
    case 'CLEAR':
      return { items: {} };
    case 'REPLACE': {
      return { items: action.items || {} };
    }
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: {} });

  // Load cart when user changes (per-user cart persistence)
  useEffect(() => {
    try {
      if (isAuthenticated && user?.email) {
        const key = `cart_${user.email}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const items = JSON.parse(raw);
          dispatch({ type: 'REPLACE', items });
        }
      } else {
        // For guests, start fresh (no persistence requirement stated)
        dispatch({ type: 'REPLACE', items: {} });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.email]);

  // Persist on changes for logged-in users
  useEffect(() => {
    try {
      if (isAuthenticated && user?.email) {
        const key = `cart_${user.email}`;
        localStorage.setItem(key, JSON.stringify(state.items));
      }
    } catch {}
  }, [state.items, isAuthenticated, user?.email]);

  const addItem = (product) => dispatch({ type: 'ADD', product });
  const removeItem = (id) => dispatch({ type: 'REMOVE', id });
  const setQty = (id, qty) => dispatch({ type: 'SET_QTY', id, qty });
  const clear = () => dispatch({ type: 'CLEAR' });

  const { count, subtotal } = useMemo(() => {
    let count = 0;
    let subtotal = 0;
    Object.values(state.items).forEach(({ product, qty }) => {
      count += qty;
      subtotal += product.price * qty;
    });
    return { count, subtotal };
  }, [state.items]);

  const value = useMemo(
    () => ({
      items: state.items,
      addItem,
      removeItem,
      setQty,
      clear,
      count,
      subtotal
    }),
    [state.items, count, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
