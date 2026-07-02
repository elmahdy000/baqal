"use client";

import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { formatEGP } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

export function FloatingCart({ storeSlug, buildingCode }: { storeSlug: string; buildingCode?: string }) {
  const [cart, api] = useCart();

  if (api.count === 0) return null;

  const params = new URLSearchParams();
  params.set("store", storeSlug);
  if (buildingCode || cart.buildingCode) {
    params.set("bcode", buildingCode ?? cart.buildingCode!);
  }

  return (
    <div className="fixed bottom-20 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <Link
        href={`/cart?${params.toString()}`}
        className="pointer-events-auto flex items-center justify-between gap-3 w-full max-w-md rounded-2xl bg-[#0c4a3b] text-white px-5 py-3.5 shadow-xl shadow-[#0c4a3b]/25 hover:bg-[#093d31] transition-all transform active:scale-95 duration-200"
      >
        <span className="flex items-center gap-2">
          <span className="bg-white/20 rounded-lg h-7 w-7 flex items-center justify-center text-xs font-black font-mono">
            {api.count}
          </span>
          <ShoppingBag className="h-5 w-5" />
          <span className="font-bold text-sm">شوف السلة</span>
        </span>
        <span className="font-black font-mono text-sm">{formatEGP(api.subtotal)}</span>
      </Link>
    </div>
  );
}
