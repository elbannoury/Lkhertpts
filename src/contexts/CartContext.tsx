import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  name: string;
  variant_title?: string;
  sku?: string;
  price: number; // cents
  image?: string;
  handle?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (product_id: string, variant_id?: string) => void;
  updateQty: (product_id: string, variant_id: string | undefined, qty: number) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (o: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ecom_cart') || '[]');
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('ecom_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart: CartContextType['addToCart'] = (item, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (c) => c.product_id === item.product_id && c.variant_id === item.variant_id,
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { ...item, quantity: qty }];
    });
    setOpen(true);
  };

  const removeFromCart = (product_id: string, variant_id?: string) =>
    setCart((prev) => prev.filter((c) => !(c.product_id === product_id && c.variant_id === variant_id)));

  const updateQty = (product_id: string, variant_id: string | undefined, qty: number) =>
    setCart((prev) =>
      prev
        .map((c) =>
          c.product_id === product_id && c.variant_id === variant_id
            ? { ...c, quantity: Math.max(1, qty) }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );

  const clearCart = () => setCart([]);
  const count = cart.reduce((s, c) => s + c.quantity, 0);
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQty, clearCart, count, subtotal, open, setOpen }}
    >
      {children}
    </CartContext.Provider>
  );
};
