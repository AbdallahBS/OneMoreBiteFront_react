import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'omb_cart_v2';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      // Clear legacy storage key if present
      localStorage.removeItem('omb_cart_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = (product, quantity = 1) => {
    if (!product) return;
    setItems((prev) => {
      const idx = prev.findIndex((item) => String(item.id) === String(product.id));
      if (idx >= 0) {
        const next = [...prev];
        const existing = next[idx];
        const newQty = (existing.quantite || 1) + quantity;
        next[idx] = { ...existing, quantite: newQty };
        return next;
      }
      return [
        ...prev,
        {
          id: product.id,
          backendId: product.backendId || product.id,
          nom: product.nom || 'Panier surprise',
          merchantName: product.merchantName || product.commercantNom || 'Commerçant Partenaire',
          commercantId: product.commercantId,
          tag: product.tag || 'Anti-Gaspi',
          pickup: product.pickup || "Aujourd'hui 18h30 - 20h00",
          prix: Number(product.prix) || 0,
          quantite: quantity,
          imageUrl: product.imageUrl || product.photoUrl,
        },
      ];
    });
  };

  const updateQuantity = (productId, delta) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (String(item.id) === String(productId)) {
            const nextQty = (item.quantite || 1) + delta;
            return nextQty > 0 ? { ...item, quantite: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((item) => String(item.id) !== String(productId)));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + (item.quantite || 1), 0);

  const totalPrice = items.reduce(
    (sum, item) => sum + (Number(item.prix) || 0) * (item.quantite || 1),
    0
  );

  const totalOriginalPrice = items.reduce(
    (sum, item) =>
      sum + (Number(item.prixOriginal) || (Number(item.prix) * 2) || 0) * (item.quantite || 1),
    0
  );

  const totalSavings = Math.max(0, totalOriginalPrice - totalPrice);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalPrice,
        totalOriginalPrice,
        totalSavings,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
