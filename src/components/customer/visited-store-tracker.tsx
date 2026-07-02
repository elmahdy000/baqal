"use client";

import { useEffect } from "react";

interface VisitedStore {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  deliveryFee: number;
  minOrderAmount: number;
}

export function VisitedStoreTracker({
  store,
}: {
  store: VisitedStore;
}) {
  useEffect(() => {
    try {
      const storageKey = "baqal_visited_stores";
      const existingRaw = localStorage.getItem(storageKey);
      let visited: VisitedStore[] = [];

      if (existingRaw) {
        visited = JSON.parse(existingRaw);
      }

      // Filter out current store if it already exists to move it to the top
      visited = visited.filter((s) => s.id !== store.id);

      // Add to front of array
      visited.unshift(store);

      // Keep only top 8 recently visited stores
      visited = visited.slice(0, 8);

      localStorage.setItem(storageKey, JSON.stringify(visited));
    } catch (e) {
      console.error("Failed to save visited store", e);
    }
  }, [store]);

  return null;
}
