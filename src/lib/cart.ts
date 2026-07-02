// Client-side cart persistence in localStorage.
// Safe to import anywhere but all mutating functions are guarded with a window check.

export type CartItem = {
  productId: string;
  quantity: number;
  notes?: string;
  snapshot: {
    name: string;
    price: number;
    imageUrl?: string;
  };
};

export type Cart = {
  storeSlug: string;
  buildingCode?: string;
  items: CartItem[];
};

const KEY = "baqal:cart";
export const CART_EVENT = "baqal:cart";

const empty = (storeSlug = "", buildingCode?: string): Cart => ({
  storeSlug,
  buildingCode,
  items: [],
});

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function notify() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCart(): Cart {
  if (!isBrowser()) return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Cart;
    if (!parsed || !Array.isArray(parsed.items)) return empty();
    return parsed;
  } catch {
    return empty();
  }
}

export function setCart(cart: Cart) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(cart));
  notify();
}

export function clearCart() {
  if (!isBrowser()) return;
  localStorage.removeItem(KEY);
  notify();
}

export function addItem(
  storeSlug: string,
  item: CartItem,
  buildingCode?: string
) {
  const current = getCart();
  // Reset cart if switching stores
  let base: Cart;
  if (!current.storeSlug || current.storeSlug !== storeSlug) {
    base = empty(storeSlug, buildingCode);
  } else {
    base = { ...current, storeSlug, buildingCode: buildingCode ?? current.buildingCode };
  }
  const idx = base.items.findIndex((i) => i.productId === item.productId && i.notes === item.notes);
  if (idx >= 0) {
    base.items[idx] = {
      ...base.items[idx],
      quantity: base.items[idx].quantity + item.quantity,
      snapshot: item.snapshot,
    };
  } else {
    base.items.push(item);
  }
  setCart(base);
}

export function removeItem(productId: string, notes?: string) {
  const current = getCart();
  const next = {
    ...current,
    items: current.items.filter((i) => !(i.productId === productId && i.notes === notes)),
  };
  setCart(next);
}

export function setQty(productId: string, quantity: number, notes?: string) {
  const current = getCart();
  if (quantity <= 0) {
    return removeItem(productId, notes);
  }
  const next = {
    ...current,
    items: current.items.map((i) =>
      i.productId === productId && i.notes === notes ? { ...i, quantity } : i
    ),
  };
  setCart(next);
}

export function cartCount(cart: Cart): number {
  return cart.items.reduce((s, i) => s + i.quantity, 0);
}

export function cartSubtotal(cart: Cart): number {
  return cart.items.reduce((s, i) => s + i.snapshot.price * i.quantity, 0);
}

// Persist orderIds so the /orders page can list past orders.
// Each entry also holds a signed HMAC token issued at placeOrder time — the
// customer order-detail API requires it.
const ORDERS_KEY = "baqal:orderIds";
const ORDER_TOKENS_KEY = "baqal:orderTokens";

export function saveOrderId(id: string, token?: string) {
  if (!isBrowser()) return;
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    if (!arr.includes(id)) {
      arr.unshift(id);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(arr.slice(0, 50)));
    }
  } catch {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([id]));
  }
  if (token) {
    try {
      const raw = localStorage.getItem(ORDER_TOKENS_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      map[id] = token;
      localStorage.setItem(ORDER_TOKENS_KEY, JSON.stringify(map));
    } catch {
      localStorage.setItem(ORDER_TOKENS_KEY, JSON.stringify({ [id]: token }));
    }
  }
}

export function getOrderIds(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function getOrderToken(id: string): string | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(ORDER_TOKENS_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[id] ?? null;
  } catch {
    return null;
  }
}

// Profile helpers
const PROFILE_KEY = "baqal:profile";
export type Profile = {
  name?: string;
  phone?: string;
  floor?: string;
  apartment?: string;
};

export function getProfile(): Profile {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : {};
  } catch {
    return {};
  }
}

export function setProfile(p: Profile) {
  if (!isBrowser()) return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}
