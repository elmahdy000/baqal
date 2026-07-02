import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEGP, cn } from "@/lib/utils";
import { orderStatusLabel, orderStatusTone } from "@/lib/labels";
import { OrderActionButtons } from "@/components/store/order-action-buttons";
import { Inbox, MapPin, Package, ShoppingBag } from "lucide-react";

const TABS: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "جديدة" },
  { status: "ACCEPTED", label: "مقبولة" },
  { status: "PREPARING", label: "بتتجهز" },
  { status: "OUT_FOR_DELIVERY", label: "في الطريق" },
  { status: "DELIVERED", label: "تم التوصيل" },
  { status: "CANCELLED", label: "ملغية" },
];

function parseStatus(raw?: string): OrderStatus {
  const valid: OrderStatus[] = [
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ];
  return valid.includes(raw as OrderStatus) ? (raw as OrderStatus) : "PENDING";
}

const EMPTY_COPY: Record<OrderStatus, { title: string; desc: string }> = {
  PENDING: {
    title: "لا يوجد طلبات جديدة الآن",
    desc: "الطلبات الجديدة هتظهر هنا فوراً مع تنبيه صوتي. اتأكد إن البقالة مفتوحة من الأعلى.",
  },
  ACCEPTED: {
    title: "لا يوجد طلبات مقبولة",
    desc: "الطلبات اللي هتقبلها من قائمة الجديدة هتنتقل هنا للتحضير.",
  },
  PREPARING: {
    title: "لا يوجد طلبات قيد التحضير",
    desc: "لما تبدأ تجهيز طلب هيظهر هنا لحد ما يخرج للتوصيل.",
  },
  OUT_FOR_DELIVERY: {
    title: "لا يوجد طلبات في الطريق",
    desc: "لما السائق يخرج بالطلب هيظهر هنا لحد ما يوصل للعميل.",
  },
  DELIVERED: {
    title: "لا يوجد طلبات تم توصيلها",
    desc: "الطلبات المكتملة بالكامل هتظهر هنا. تقدر تراجعها في التقارير.",
  },
  CANCELLED: {
    title: "لا يوجد طلبات ملغية",
    desc: "الطلبات اللي تم رفضها أو إلغاؤها هتظهر هنا.",
  },
  REJECTED: {
    title: "لا يوجد طلبات مرفوضة",
    desc: "الطلبات اللي رفضتها هتظهر هنا للمراجعة.",
  },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireStore();
  const sp = await searchParams;
  const status = parseStatus(sp.status);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [orders, counts, todayCount, todaySalesAgg] = await Promise.all([
    db.order.findMany({
      where: { storeId: user.storeId, status },
      include: {
        customer: true,
        building: true,
        address: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.order.groupBy({
      by: ["status"],
      where: { storeId: user.storeId },
      _count: { _all: true },
    }),
    db.order.count({
      where: { storeId: user.storeId, createdAt: { gte: startOfDay } },
    }),
    db.order.aggregate({
      where: {
        storeId: user.storeId,
        createdAt: { gte: startOfDay },
        status: "DELIVERED",
      },
      _sum: { total: true },
    }),
  ]);

  const countByStatus = new Map<OrderStatus, number>();
  counts.forEach((c) => countByStatus.set(c.status, c._count._all));

  const pendingCount = countByStatus.get("PENDING") ?? 0;
  const activeCount =
    (countByStatus.get("ACCEPTED") ?? 0) +
    (countByStatus.get("PREPARING") ?? 0) +
    (countByStatus.get("OUT_FOR_DELIVERY") ?? 0);
  const todaySales = Number(todaySalesAgg._sum.total ?? 0);

  const empty = EMPTY_COPY[status];

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">إدارة الطلبات</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            متابعة الطلبات المستلمة ومعالجتها لحظة بلحظة
          </p>
        </div>
        <Link
          href="/store/pos"
          className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white px-3.5 py-2 text-xs font-bold transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          بيع مباشر
        </Link>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-[#E5E7EB] bg-white shadow-none">
          <CardContent className="p-4">
            <div className="text-[11px] font-medium text-[#6B7280]">
              بانتظار القبول
            </div>
            <div className="mt-1 text-2xl font-black text-[#F97316]">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7EB] bg-white shadow-none">
          <CardContent className="p-4">
            <div className="text-[11px] font-medium text-[#6B7280]">
              طلبات نشطة
            </div>
            <div className="mt-1 text-2xl font-black text-[#0369A1]">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7EB] bg-white shadow-none">
          <CardContent className="p-4">
            <div className="text-[11px] font-medium text-[#6B7280]">
              طلبات اليوم
            </div>
            <div className="mt-1 text-2xl font-black text-[#111827]">
              {todayCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7EB] bg-white shadow-none">
          <CardContent className="p-4">
            <div className="text-[11px] font-medium text-[#6B7280]">
              مبيعات اليوم
            </div>
            <div className="mt-1 text-2xl font-black text-[#16A34A]">
              {formatEGP(todaySales)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB]">
        <div className="flex items-center gap-1 overflow-x-auto -mb-px">
          {TABS.map((t) => {
            const active = t.status === status;
            const n = countByStatus.get(t.status) ?? 0;
            return (
              <Link
                key={t.status}
                href={`/store/orders?status=${t.status}`}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors border-b-2",
                  active
                    ? "border-[#16A34A] text-[#166534]"
                    : "border-transparent text-[#6B7280] hover:text-[#111827] hover:border-[#E5E7EB]"
                )}
              >
                <span>{t.label}</span>
                {n > 0 && (
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                      active
                        ? "bg-[#DCFCE7] text-[#166534]"
                        : "bg-[#F3F4F6] text-[#6B7280]"
                    )}
                  >
                    {n}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {status === "PENDING" && (
        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#16A34A]" />
          </span>
          الصفحة تتحدث تلقائياً عند وصول طلب جديد
        </div>
      )}

      {/* Orders list */}
      {orders.length === 0 ? (
        <Card className="border-[#E5E7EB] bg-white shadow-none">
          <CardContent className="p-10 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center">
              <Inbox className="h-6 w-6 text-[#9CA3AF]" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#111827]">
              {empty.title}
            </h3>
            <p className="mt-1.5 text-sm text-[#6B7280] max-w-md mx-auto">
              {empty.desc}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Link
                href="/store/products"
                className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] px-3.5 py-2 text-xs font-bold text-[#111827]"
              >
                <Package className="h-4 w-4 text-[#6B7280]" />
                إدارة المنتجات
              </Link>
              <Link
                href="/store/pos"
                className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] px-3.5 py-2 text-xs font-bold text-white"
              >
                <ShoppingBag className="h-4 w-4" />
                فتح POS
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => (
            <Card
              key={o.id}
              className="border-[#E5E7EB] bg-white shadow-none hover:border-gray-300 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#F3F4F6]">
                  <div>
                    <Link
                      href={`/store/orders/${o.id}`}
                      className="text-sm font-bold text-[#111827] hover:text-[#16A34A]"
                    >
                      طلب #{o.orderNumber}
                    </Link>
                    <div className="text-[11px] text-[#6B7280] mt-0.5">
                      {formatDistanceToNow(o.createdAt, {
                        addSuffix: true,
                        locale: arEG,
                      })}
                    </div>
                  </div>
                  <Badge
                    tone={orderStatusTone(o.status)}
                    className="text-[10px] font-bold"
                  >
                    {orderStatusLabel(o.status)}
                  </Badge>
                </div>

                <div className="pt-3 space-y-1.5">
                  <div className="text-[13px] font-bold text-[#111827] truncate">
                    {o.customer.name}
                    <span className="text-[#9CA3AF] font-normal mx-1">·</span>
                    <span className="font-normal text-[#6B7280]">
                      {o.customer.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {o.building?.name ?? "—"}
                      {o.address?.floor ? ` · دور ${o.address.floor}` : ""}
                      {o.address?.apartment
                        ? ` · شقة ${o.address.apartment}`
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-lg bg-[#F8FAFC] border border-[#F3F4F6] px-3 py-2">
                  <span className="text-[11px] text-[#6B7280]">
                    {o.items.length} صنف
                  </span>
                  <span className="text-sm font-black text-[#111827]">
                    {formatEGP(Number(o.total))}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <Link
                    href={`/store/orders/${o.id}`}
                    className="text-[11px] font-bold text-[#16A34A] hover:underline"
                  >
                    تفاصيل ←
                  </Link>
                  <OrderActionButtons
                    orderId={o.id}
                    status={o.status}
                    compact
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
