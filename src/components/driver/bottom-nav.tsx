"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, CheckCircle2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/driver", label: "الطلبات", icon: ClipboardList, exact: true },
  { href: "/driver/delivered", label: "تم التوصيل", icon: CheckCircle2 },
  { href: "/driver/account", label: "حسابي", icon: User },
];

export function DriverBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {items.map((it) => {
          const active = it.exact
            ? pathname === it.href
            : pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-xs font-medium",
                active ? "text-green-700" : "text-gray-500"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
