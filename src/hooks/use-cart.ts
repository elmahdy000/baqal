"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCart,
  setCart as setCartRaw,
  addItem as addItemRaw,
  removeItem as removeItemRaw,
  setQty as setQtyRaw,
  clearCart as clearCartRaw,
  cartCount,
  cartSubtotal,
  CART_EVENT,
  type Cart,
  type CartItem,
} from "@/lib/cart";

export type CartApi = {
  setCart: (c: Cart) => void;
  addItem: (storeSlug: string, item: CartItem, buildingCode?: string) => void;
  removeItem: (productId: string, notes?: string) => void;
  setQty: (productId: string, quantity: number, notes?: string) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
};

export function useCart(): [Cart, CartApi] {
  const [cart, setCartState] = useState<Cart>(() => ({
    storeSlug: "",
    items: [],
  }));

  useEffect(() => {
    // Hydrate on mount
    setCartState(getCart());
    const handler = () => setCartState(getCart());
    const storageHandler = (e: StorageEvent) => {
      if (e.key === "baqal:cart") handler();
    };
    window.addEventListener(CART_EVENT, handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener(CART_EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const setCart = useCallback((c: Cart) => setCartRaw(c), []);
  const addItem = useCallback(
    (storeSlug: string, item: CartItem, buildingCode?: string) =>
      addItemRaw(storeSlug, item, buildingCode),
    []
  );
  const removeItem = useCallback((id: string, notes?: string) => removeItemRaw(id, notes), []);
  const setQty = useCallback(
    (id: string, q: number, notes?: string) => setQtyRaw(id, q, notes),
    []
  );
  const clearCart = useCallback(() => clearCartRaw(), []);

  return [
    cart,
    {
      setCart,
      addItem,
      removeItem,
      setQty,
      clearCart,
      count: cartCount(cart),
      subtotal: cartSubtotal(cart),
    },
  ];
}
