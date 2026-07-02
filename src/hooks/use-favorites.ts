"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getFavorites,
  toggleFavorite as toggleRaw,
  addFavorite as addRaw,
  removeFavorite as removeRaw,
  FAVORITES_EVENT,
} from "@/lib/favorites";

export function useFavorites(storeSlug: string) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (!storeSlug) {
      setIds([]);
      return;
    }
    setIds(getFavorites(storeSlug));
    const handler = () => setIds(getFavorites(storeSlug));
    const storageHandler = (e: StorageEvent) => {
      if (e.key === `baqal:favorites:${storeSlug}`) handler();
    };
    window.addEventListener(FAVORITES_EVENT, handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, [storeSlug]);

  const toggle = useCallback(
    (productId: string) => {
      if (!storeSlug) return false;
      return toggleRaw(storeSlug, productId);
    },
    [storeSlug]
  );

  const add = useCallback(
    (productId: string) => {
      if (!storeSlug) return;
      addRaw(storeSlug, productId);
    },
    [storeSlug]
  );

  const remove = useCallback(
    (productId: string) => {
      if (!storeSlug) return;
      removeRaw(storeSlug, productId);
    },
    [storeSlug]
  );

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  return { ids, has, toggle, add, remove };
}
