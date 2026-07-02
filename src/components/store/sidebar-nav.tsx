"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Building2,
  QrCode,
  Settings,
  BarChart3,
  Tag,
  Percent,
  MessageSquare,
  Truck,
  Users,
  Wallet,
  Store,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const groups: { title: string; items: Item[] }[] = [
  {
    title: "العمليات اليومية",
    items: [
      { href: "/store", label: "الرئيسية", icon: LayoutDashboard, exact: true },
      { href: "/store/orders", label: "الطلبات", icon: ShoppingBag },
      { href: "/store/pos", label: "نقطة البيع", icon: Store },
      { href: "/store/custom-requests", label: "طلبات النواقص", icon: MessageSquare },
    ],
  },
  {
    title: "المنتجات والمخزون",
    items: [
      { href: "/store/products", label: "المنتجات", icon: Package },
      { href: "/store/categories", label: "الفئات", icon: Tag },
      { href: "/store/inventory", label: "المخزون", icon: Boxes },
      { href: "/store/offers", label: "العروض", icon: Percent },
    ],
  },
  {
    title: "العملاء والتوصيل",
    items: [
      { href: "/store/customers", label: "العملاء", icon: Users },
      { href: "/store/drivers", label: "السائقين", icon: Truck },
      { href: "/store/buildings", label: "العمارات", icon: Building2 },
      { href: "/store/qrcodes", label: "أكواد QR", icon: QrCode },
    ],
  },
  {
    title: "المالية والإعدادات",
    items: [
      { href: "/store/settlements", label: "التسويات", icon: Wallet },
      { href: "/store/reports", label: "التقارير", icon: BarChart3 },
      { href: "/store/settings", label: "الإعدادات", icon: Settings },
    ],
  },
];

export function StoreSidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-1.5">
          <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
            {group.title}
          </h3>
          <div className="flex flex-col gap-0.5">
            {group.items.map((it) => {
              const active = it.exact
                ? pathname === it.href
                : pathname === it.href || pathname.startsWith(it.href + "/");
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-[#DCFCE7] text-[#166534] font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-1 end-0 w-0.5 rounded bg-[#16A34A]" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active
                        ? "text-[#16A34A]"
                        : "text-gray-400 group-hover:text-gray-700"
                    )}
                  />
                  <span className="truncate">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
