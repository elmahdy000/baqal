import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatEGP } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/customer/order-timeline";
import { OrderRealtime } from "@/components/customer/order-realtime";
import { CancelOrderButton } from "@/components/customer/cancel-order-button";
import { RepeatOrderButton } from "@/components/customer/repeat-order-button";
import { BottomNav } from "@/components/customer/bottom-nav";
import { orderStatusLabel, orderStatusTone } from "@/lib/labels";
import { ArrowRight, Phone, MapPin } from "lucide-react";

import { verifyOrderToken } from "@/lib/order-token";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t: token } = await searchParams;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      store: { select: { slug: true, name: true, nameAr: true, phone: true } },
      building: true,
      address: true,
      customer: true,
    },
  });

  if (!order) notFound();

  // Validate authorization: HMAC token OR active dashboard session matching the store
  let authorized = false;
  if (token && verifyOrderToken(id, token)) {
    authorized = true;
  } else {
    const session = await auth();
    const user = session?.user;
    if (user) {
      if (user.role === "SUPER_ADMIN") {
        authorized = true;
      } else if (
        (user.role === "STORE_OWNER" || user.role === "STORE_STAFF") &&
        user.storeId === order.storeId
      ) {
        authorized = true;
      } else if (user.role === "DELIVERY" && user.id === order.driverId) {
        authorized = true;
      }
    }
  }

  if (!authorized) notFound();

  const paymentMethodLabel =
    order.paymentMethod === "PAY_LATER" ? "ادفع بعدين" : "كاش عند الاستلام";

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24" dir="rtl">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto w-full">
          <div className="flex items-center gap-3">
            <Link href="/orders" className="text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-base font-black text-gray-900">
                طلب #{order.orderNumber}
              </h1>
              <p className="text-xs font-bold text-gray-400 mt-0.5">
                {order.store.nameAr ?? order.store.name}
              </p>
            </div>
          </div>
          <Badge tone={orderStatusTone(order.status)} className="rounded-lg font-black px-2.5 py-0.5">
            {orderStatusLabel(order.status)}
          </Badge>
        </div>
      </header>

      <OrderRealtime orderId={order.id} initialStatus={order.status} />

      <main className="p-4 space-y-4 max-w-md mx-auto">
        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold text-gray-800">حالة الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline status={order.status} />
          </CardContent>
        </Card>

        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold text-gray-800">المنتجات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-sm">
            <div className="space-y-2">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between items-start text-gray-700 font-medium gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="line-clamp-2">
                      {it.productNameSnapshot}
                      {it.notes && (
                        <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-100 rounded px-1.5 py-0.5 mr-1.5 font-extrabold inline-block">
                          {it.notes}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-450 font-mono mt-0.5">× {it.quantity}</span>
                  </div>
                  <span className="font-mono text-gray-900 font-bold shrink-0">{formatEGP(Number(it.totalPrice))}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="flex justify-between text-gray-500 font-bold text-xs">
                <span>المجموع الفرعي</span>
                <span className="font-mono">{formatEGP(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-bold text-xs">
                <span>التوصيل</span>
                <span className="font-mono">{formatEGP(Number(order.deliveryFee))}</span>
              </div>
              <div className="flex justify-between font-black text-gray-950 pt-2 border-t border-slate-100 text-base">
                <span>الإجمالي</span>
                <span className="font-mono text-[#0c4a3b]">{formatEGP(Number(order.total))}</span>
              </div>
            </div>
            <div className="text-[11px] font-black text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg inline-block border border-slate-100/50">
              {paymentMethodLabel}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold text-gray-800">التوصيل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {order.building && (
              <div className="flex items-center gap-2 text-gray-700 font-bold">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>عمارة {order.building.name}</span>
              </div>
            )}
            {(order.address?.floor || order.address?.apartment) && (
              <div className="text-gray-500 font-bold text-xs">
                {order.address?.floor && `الطابق ${order.address.floor}`}
                {order.address?.floor && order.address?.apartment && " · "}
                {order.address?.apartment && `شقة ${order.address.apartment}`}
              </div>
            )}
            {order.address?.deliveryNotes && (
              <div className="text-xs text-gray-400 font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                ملاحظات: {order.address.deliveryNotes}
              </div>
            )}
            {order.store.phone && (
              <a
                href={`tel:${order.store.phone}`}
                className="inline-flex items-center gap-2 text-sm text-[#0c4a3b] font-black mt-2 bg-[#f0faf7] px-3.5 py-2 rounded-xl border border-[#bfeade]/50 hover:bg-[#e6f4f1] transition-colors"
              >
                <Phone className="h-4 w-4" />
                اتصل بالبقال
              </a>
            )}
          </CardContent>
        </Card>

        {order.status === "PENDING" && (
          <div className="flex justify-end pt-1">
            <CancelOrderButton orderId={order.id} />
          </div>
        )}

        {(order.status === "DELIVERED" || order.status === "CANCELLED") && (
          <div className="pt-1">
            <RepeatOrderButton orderId={order.id} />
          </div>
        )}
      </main>

      <BottomNav storeSlug={order.store.slug} />
    </div>
  );
}
