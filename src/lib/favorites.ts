// Client-side favorites persistence in localStorage, keyed per store slug.

export const FAVORITES_EVENT = "baqal:favorites";

function keyFor(storeSlug: string) {
  return `baqal:favorites:${storeSlug}`;
}

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function notify() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export function getFavorites(storeSlug: string): string[] {
  if (!isBrowser() || !storeSlug) return [];
  try {
    const raw = localStorage.getItem(keyFor(storeSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(storeSlug: string, ids: string[]) {
  if (!isBrowser() || !storeSlug) return;
  localStorage.setItem(keyFor(storeSlug), JSON.stringify(ids));
  notify();
}

export function addFavorite(storeSlug: string, productId: string) {
  const current = getFavorites(storeSlug);
  if (current.includes(productId)) return;
  saveFavorites(storeSlug, [productId, ...current]);
}

export function removeFavorite(storeSlug: string, productId: string) {
  const current = getFavorites(storeSlug);
  const next = current.filter((id) => id !== productId);
  if (next.length === current.length) return;
  saveFavorites(storeSlug, next);
}

export function toggleFavorite(storeSlug: string, productId: string): boolean {
  const current = getFavorites(storeSlug);
  if (current.includes(productId)) {
    saveFavorites(
      storeSlug,
      current.filter((id) => id !== productId)
    );
    return false;
  }
  saveFavorites(storeSlug, [productId, ...current]);
  return true;
}

export function isFavorite(storeSlug: string, productId: string): boolean {
  return getFavorites(storeSlug).includes(productId);
}
