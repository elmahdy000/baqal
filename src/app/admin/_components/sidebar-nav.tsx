"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Building2,
  QrCode,
  ShoppingBag,
  Settings,
  BarChart3,
  CreditCard,
  Receipt,
  MapPin,
  Wallet,
  Users,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { href: "/admin/stores", label: "البقالات", icon: Store },
  { href: "/admin/buildings", label: "العمارات", icon: Building2 },
  { href: "/admin/areas", label: "المناطق", icon: MapPin },
  { href: "/admin/qrcodes", label: "أكواد QR", icon: QrCode },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/plans", label: "الخطط", icon: CreditCard },
  { href: "/admin/subscriptions", label: "الاشتراكات", icon: Receipt },
  { href: "/admin/settlements", label: "التسويات", icon: Wallet },
  { href: "/admin/reports", label: "التقارير", icon: BarChart3 },
  { href: "/admin/support", label: "الدعم", icon: LifeBuoy },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((it) => {
        const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/");
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-green-50 text-green-700"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
