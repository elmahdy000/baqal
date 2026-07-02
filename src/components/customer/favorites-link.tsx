"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";

export function FavoritesLink({ storeSlug }: { storeSlug: string }) {
  const favorites = useFavorites(storeSlug);
  const count = favorites.ids.length;

  return (
    <Link
      href="/favorites"
      aria-label="المفضلة"
      className="relative h-10 w-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center"
    >
      <Heart className="h-5 w-5 text-red-500" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center px-1">
          {count}
        </span>
      )}
    </Link>
  );
}
