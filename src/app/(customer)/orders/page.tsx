"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { getOrderIds, getOrderToken } from "@/lib/cart";
import { Card, CardContent } from "@/components/ui/card";
import { formatEGP, cn } from "@/lib/utils";
import { orderStatusLabel } from "@/lib/labels";
import { BottomNav } from "@/components/customer/bottom-nav";
import { ClipboardList } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { useSearchParams } from "next/navigation";

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  store: { name: string; nameAr: string | null; slug: string };
  items: { id: string; productNameSnapshot: string; quantity: number; notes?: string | null }[];
};

const ACTIVE_STATUSES: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
];

function renderStatusBadge(status: OrderStatus) {
  const label = orderStatusLabel(status);
  switch (status) {
    case "PENDING":
      return (
        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-amber-50 border border-amber-200 text-amber-700 shadow-sm shrink-0">
          {label}
        </span>
      );
    case "ACCEPTED":
    case "PREPARING":
      return (
        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-blue-50 border border-blue-200 text-blue-700 shadow-sm shrink-0">
          {label}
        </span>
      );
    case "OUT_FOR_DELIVERY":
      return (
        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-orange-50 border border-orange-200 text-orange-700 shadow-sm shrink-0">
          {label}
        </span>
      );
    case "DELIVERED":
      return (
        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm shrink-0">
          {label}
        </span>
      );
    case "CANCELLED":
    case "REJECTED":
      return (
        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-red-50 border border-red-200 text-red-700 shadow-sm shrink-0">
          {label}
        </span>
      );
    default:
      return (
        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-slate-50 border border-slate-200 text-slate-700 shadow-sm shrink-0">
          {label}
        </span>
      );
  }
}

function OrdersContent() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const storeSlug = searchParams.get("store") || "";

  useEffect(() => {
    const ids = getOrderIds();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(
      ids.map((id) => {
        const token = getOrderToken(id);
        const url = token
          ? `/api/customer/orders/${id}?t=${encodeURIComponent(token)}`
          : `/api/customer/orders/${id}`;
        return fetch(url)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
      })
    )
      .then((results) => {
        const ok = results.filter(Boolean) as OrderSummary[];
        setOrders(ok);
      })
      .finally(() => setLoading(false));
  }, []);

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const done = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  return (
    <div className="min-h-screen bg-slate-50 pb-24" dir="rtl">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100/80 px-4 py-3.5 shadow-sm">
        <h1 className="text-lg font-black text-slate-900">طلباتي</h1>
        <p className="text-[10px] text-slate-500 font-extrabold mt-0.5">تابع حالة كل طلب بسهولة</p>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto">
        {loading ? (
          <div className="text-center text-slate-400 font-bold py-12 animate-pulse text-sm">جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mb-4 shadow-sm border border-green-100">
              <ClipboardList className="h-8 w-8 text-[#16A34A]" />
            </div>
            <h2 className="text-base font-black text-slate-900 mb-1">
              لسه معملتش طلبات
            </h2>
            <p className="text-xs text-slate-400 font-extrabold max-w-[250px] leading-relaxed">
              ابدأ اختار منتجاتك واطلب بسهولة وهتظهر هنا مباشرة لمتابعتها.
            </p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-black text-slate-400 px-1">
                  قيد التنفيذ
                </h2>
                <div className="space-y-3.5">
                  {active.map((o) => (
                    <OrderRow key={o.id} order={o} />
                  ))}
                </div>
              </section>
            )}
            {done.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-black text-slate-400 px-1">تم التوصيل / منتهي</h2>
                <div className="space-y-3.5">
                  {done.map((o) => (
                    <OrderRow key={o.id} order={o} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav storeSlug={storeSlug} />
    </div>
  );
}

function OrderRow({ order }: { order: OrderSummary }) {
  const token = getOrderToken(order.id);
  const href = token
    ? `/orders/${order.id}?t=${encodeURIComponent(token)}`
    : `/orders/${order.id}`;

  return (
    <Link href={href} className="block">
      <Card className="hover:shadow-md border-slate-200/80 rounded-2xl shadow-sm transition-all duration-305 hover:-translate-y-0.5 bg-white group overflow-hidden">
        <CardContent className="space-y-3 py-4 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-extrabold text-slate-900 text-sm group-hover:text-[#16A34A] transition-colors truncate">
                {order.store.nameAr ?? order.store.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono font-black mt-0.5">#{order.orderNumber}</div>
            </div>
            {renderStatusBadge(order.status)}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {order.items.map((i) => (
              <span
                key={i.id}
                className="bg-slate-50 border border-slate-100/60 rounded-xl px-2.5 py-1 text-xs text-slate-600 font-extrabold shadow-sm inline-flex items-center gap-1.5"
              >
                <span>{i.productNameSnapshot}</span>
                {i.notes && (
                  <span className="text-[9px] text-[#EA580C] bg-orange-50 border border-[#FED7AA] rounded px-1 py-0.5 font-black">
                    {i.notes}
                  </span>
                )}
                <span className="text-slate-400 font-mono">×{i.quantity}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-50">
            <span className="text-slate-400 text-[10px] font-bold font-mono">
              {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-extrabold">الإجمالي:</span>
              <span className="font-black text-[#15803D] font-mono text-base">
                {formatEGP(order.total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400 font-bold">جاري التحميل...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
