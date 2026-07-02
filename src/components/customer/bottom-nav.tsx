"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, ClipboardList, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

export function BottomNav({ storeSlug }: { storeSlug?: string }) {
  const pathname = usePathname();
  const [cart, api] = useCart();

  const currentSlug = storeSlug || cart.storeSlug || "";
  const bcode = cart.buildingCode;

  const homeHref = currentSlug ? `/s/${currentSlug}${bcode ? `?bcode=${bcode}` : ""}` : "/";
  const offersHref = currentSlug ? `/s/${currentSlug}?cat=offers${bcode ? `&bcode=${bcode}` : ""}` : "/";
  const ordersHref = currentSlug ? `/orders?store=${currentSlug}` : "/orders";
  const profileHref = currentSlug ? `/profile?store=${currentSlug}` : "/profile";
  const cartHref = currentSlug ? `/cart?store=${currentSlug}` : "/cart";

  const items = [
    { href: homeHref, icon: Home, label: "الرئيسية", active: pathname.startsWith("/s/") },
    { href: offersHref, icon: Tag, label: "العروض", active: false },
    { href: ordersHref, icon: ClipboardList, label: "طلباتي", active: pathname.startsWith("/orders") },
    { href: cartHref, icon: ShoppingBag, label: "السلة", active: pathname.startsWith("/cart"), badge: api.count },
    { href: profileHref, icon: User, label: "حسابي", active: pathname.startsWith("/profile") },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-lg shadow-slate-200/50 pb-safe">
      <div className="mx-auto max-w-3xl grid grid-cols-5 h-16.5 py-1 px-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              href={it.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-extrabold relative transition-colors duration-200",
                it.active ? "text-[#15803D]" : "text-slate-400 hover:text-slate-650"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center px-4.5 py-1 rounded-xl transition-all duration-300",
                it.active ? "bg-[#ECFDF5]" : "bg-transparent"
              )}>
                <Icon className={cn("h-5 w-5 transition-transform duration-200", it.active && "scale-105")} />
                {typeof it.badge === "number" && it.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1 min-w-[16px] h-4 rounded-full bg-[#DC2626] text-white text-[9px] flex items-center justify-center px-1 font-black font-mono shadow-sm">
                    {it.badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[10px] tracking-tight">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
