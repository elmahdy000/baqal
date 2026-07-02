"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrderIds } from "@/lib/cart";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNav } from "@/components/customer/bottom-nav";
import { orderStatusLabel } from "@/lib/labels";
import type { OrderStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Bell,
  BellOff,
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
} from "lucide-react";

type Notif = {
  orderId: string;
  orderNumber: string;
  storeSlug: string;
  status: string;
  createdAt: string;
  note?: string | null;
};

const iconFor: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-5 w-5 text-slate-400" />,
  ACCEPTED: <CheckCircle className="h-5 w-5 text-[#0c4a3b]" />,
  PREPARING: <Package className="h-5 w-5 text-blue-500" />,
  OUT_FOR_DELIVERY: <Truck className="h-5 w-5 text-orange-500" />,
  DELIVERED: <CheckCircle className="h-5 w-5 text-[#0c4a3b]" />,
  CANCELLED: <XCircle className="h-5 w-5 text-red-500" />,
  REJECTED: <XCircle className="h-5 w-5 text-red-500" />,
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const ids = getOrderIds();
      if (ids.length === 0) {
        setLoading(false);
        return;
      }
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/api/customer/orders/${id}`);
            if (!res.ok) return null;
            const order = await res.json();
            const history = Array.isArray(order.history) ? order.history : [];
            return history.map((h: { status: string; note?: string | null; createdAt: string }) => ({
              orderId: order.id,
              orderNumber: order.orderNumber,
              storeSlug: order.store?.slug,
              status: h.status,
              createdAt: h.createdAt,
              note: h.note,
            }));
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      const flat = results
        .flat()
        .filter((n): n is Notif => Boolean(n && n.storeSlug))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      setNotifs(flat);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24" dir="rtl">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-4 shadow-sm">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-lg font-black text-gray-900">الإشعارات</h1>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {loading ? (
          <div className="text-center text-gray-400 font-bold py-10">جاري التحميل...</div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="h-20 w-20 mx-auto rounded-2xl bg-[#e6f4f1] flex items-center justify-center mb-5 shadow-sm">
              <BellOff className="h-10 w-10 text-[#0c4a3b]" />
            </div>
            <div className="font-black text-gray-900 text-base">مفيش إشعارات لسه</div>
            <div className="text-xs text-gray-400 font-bold">
              هتوصلك تحديثات الطلبات هنا
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map((n, i) => (
              <Link
                key={`${n.orderId}-${i}`}
                href={`/orders/${n.orderId}`}
                className="block"
              >
                <Card className="hover:shadow-md border-slate-100 rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5">
                  <CardContent className="py-4 px-4 flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100/50">
                      {iconFor[n.status] ?? (
                        <Bell className="h-5 w-5 text-gray-450" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-extrabold text-sm text-gray-900">
                          {orderStatusLabel(n.status as OrderStatus)}
                        </div>
                        <div className="text-[11px] text-gray-400 font-bold shrink-0">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-bold mt-1 font-mono">
                        طلب #{n.orderNumber}
                      </div>
                      {n.note && (
                        <div className="text-xs text-gray-405 font-medium mt-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100/30 line-clamp-2">
                          {n.note}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
