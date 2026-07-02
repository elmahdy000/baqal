import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { formatEGP } from "@/lib/utils";
import { OrderActionButtons } from "@/components/store/order-action-buttons";
import { getStoreCommissionSummary } from "@/server/queries/commission";
import { formatCommissionRate } from "@/lib/commission";
import {
  ShoppingBag,
  Clock,
  TrendingUp,
  Package,
  AlertTriangle,
  AlertCircle,
  Plus,
  QrCode,
  Store as StoreIcon,
  MapPin,
  ArrowUpLeft,
  Wallet,
  CheckCircle2,
} from "lucide-react";

export default async function StoreHomePage() {
  const user = await requireStore();
  const storeId = user.storeId;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const [
    todayOrdersCount,
    pendingCount,
    acceptedCount,
    outForDeliveryCount,
    todaySalesAgg,
    weekSalesAgg,
    availableCount,
    outCount,
    lowRows,
    pendingOrders,
    weekOrdersCount,
  ] = await Promise.all([
    db.order.count({
      where: { storeId, createdAt: { gte: startOfDay } },
    }),
    db.order.count({ where: { storeId, status: "PENDING" } }),
    db.order.count({ where: { storeId, status: "ACCEPTED" } }),
    db.order.count({ where: { storeId, status: "OUT_FOR_DELIVERY" } }),
    db.order.aggregate({
      where: {
        storeId,
        createdAt: { gte: startOfDay },
        status: { in: ["ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"] },
      },
      _sum: { total: true },
    }),
    db.order.aggregate({
      where: {
        storeId,
        createdAt: { gte: startOfWeek },
        status: "DELIVERED",
      },
      _sum: { total: true },
    }),
    db.product.count({ where: { storeId, isAvailable: true } }),
    db.product.count({ where: { storeId, stockQuantity: 0 } }),
    db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Product"
      WHERE "storeId" = ${storeId}
        AND "stockQuantity" > 0
        AND "stockQuantity" <= "lowStockThreshold"
    `,
    db.order.findMany({
      where: { storeId, status: "PENDING" },
      include: {
        customer: true,
        building: true,
        address: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.order.count({
      where: {
        storeId,
        createdAt: { gte: startOfWeek },
        status: "DELIVERED",
      },
    }),
  ]);

  const lowStockCount = Number(lowRows[0]?.count ?? 0);
  const todaySales = Number(todaySalesAgg._sum.total ?? 0);
  const weekSales = Number(weekSalesAgg._sum.total ?? 0);
  const activeCount = pendingCount + acceptedCount + outForDeliveryCount;

  const commission = await getStoreCommissionSummary(storeId);

  const kpis = [
    {
      label: "طلبات اليوم",
      value: todayOrdersCount.toString(),
      icon: ShoppingBag,
      color: "text-[#16A34A]",
      bg: "bg-[#DCFCE7]",
      hint: `آخر 7 أيام: ${weekOrdersCount}`,
    },
    {
      label: "مبيعات اليوم",
      value: formatEGP(todaySales),
      icon: TrendingUp,
      color: "text-[#0369A1]",
      bg: "bg-[#DBEAFE]",
      hint: `أسبوعياً: ${formatEGP(weekSales)}`,
    },
    {
      label: "طلبات نشطة",
      value: activeCount.toString(),
      icon: Clock,
      color: "text-[#F97316]",
      bg: "bg-[#FFEDD5]",
      hint: `${pendingCount} في الانتظار`,
    },
    {
      label: "منتجات متاحة",
      value: availableCount.toString(),
      icon: Package,
      color: "text-[#7C3AED]",
      bg: "bg-[#EDE9FE]",
      hint: `${outCount + lowStockCount} تحتاج انتباه`,
    },
  ];

  const hasOwed = commission.totalOwed > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Title + quick actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">
            أهلاً {user.name?.split(" ")[0] ?? ""} — نظرة عامة على اليوم
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            كل ما تحتاجه لتشغيل البقالة في مكان واحد
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/store/pos"
            className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white px-3.5 py-2 text-xs font-bold transition-colors"
          >
            <StoreIcon className="h-4 w-4" />
            <span>افتح POS</span>
          </Link>
          <Link
            href="/store/products/new"
            className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#111827] px-3.5 py-2 text-xs font-bold transition-colors"
          >
            <Plus className="h-4 w-4 text-[#6B7280]" />
            <span>منتج جديد</span>
          </Link>
          <Link
            href="/store/qrcodes"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#111827] px-3.5 py-2 text-xs font-bold transition-colors"
          >
            <QrCode className="h-4 w-4 text-[#6B7280]" />
            <span>أكواد QR</span>
          </Link>
        </div>
      </div>

      {/* Row 1: 4 KPIs (compact, dense) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card
              key={k.label}
              className="border-[#E5E7EB] bg-white shadow-none hover:border-gray-300 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-[#6B7280]">
                      {k.label}
                    </div>
                    <div className="mt-1.5 text-2xl font-black text-[#111827] tracking-tight">
                      {k.value}
                    </div>
                  </div>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.bg} ${k.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-[#6B7280] border-t border-[#F3F4F6] pt-2">
                  {k.hint}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Row 2: Platform balance (compact) + inventory alerts (compact) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card
          className={`lg:col-span-2 border shadow-none ${
            hasOwed ? "border-[#FED7AA] bg-[#FFF7ED]" : "border-[#BBF7D0] bg-[#F0FDF4]"
          }`}
        >
          <CardContent className="p-4 flex items-center gap-4 flex-wrap">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                hasOwed ? "bg-[#FED7AA] text-[#C2410C]" : "bg-[#BBF7D0] text-[#166534]"
              }`}
            >
              {hasOwed ? <Wallet className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-[180px]">
              <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
                رصيد المنصة المستحق
              </div>
              <div
                className={`mt-0.5 text-2xl font-black tracking-tight ${
                  hasOwed ? "text-[#C2410C]" : "text-[#166534]"
                }`}
              >
                {formatEGP(commission.totalOwed)}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">
                {hasOwed
                  ? `من ${commission.ordersUnsettled} طلب — نسبة ${formatCommissionRate(commission.currentRate)}`
                  : "لا مستحقات حالياً. الحساب مستقر."}
              </div>
            </div>
            <Link
              href="/store/settlements"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] px-3 py-2 text-xs font-bold hover:bg-[#F8FAFC] transition-colors"
            >
              التسويات
              <ArrowUpLeft className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB] bg-white shadow-none">
          <CardContent className="p-4">
            <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
              حالة المخزون
            </div>
            <div className="mt-3 flex items-center gap-4">
              <Link
                href="/store/inventory?filter=out"
                className="flex-1 flex items-center gap-2 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#DC2626]">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-lg font-black text-[#111827] leading-none">
                    {outCount}
                  </div>
                  <div className="text-[10px] text-[#6B7280] mt-0.5 group-hover:text-[#111827]">
                    نفد
                  </div>
                </div>
              </Link>
              <div className="h-8 w-px bg-[#E5E7EB]" />
              <Link
                href="/store/inventory?filter=low"
                className="flex-1 flex items-center gap-2 group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#B45309]">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-lg font-black text-[#111827] leading-none">
                    {lowStockCount}
                  </div>
                  <div className="text-[10px] text-[#6B7280] mt-0.5 group-hover:text-[#111827]">
                    منخفض
                  </div>
                </div>
              </Link>
            </div>
            <Link
              href="/store/inventory"
              className="mt-3 block text-[11px] font-bold text-[#16A34A] hover:underline"
            >
              فتح المخزون ←
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Pending orders + plan summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Pending orders */}
        <Card className="lg:col-span-2 border-[#E5E7EB] bg-white shadow-none">
          <div className="flex items-center justify-between border-b border-[#F3F4F6] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {pendingOrders.length > 0 && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F59E0B] opacity-70" />
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    pendingOrders.length > 0 ? "bg-[#F59E0B]" : "bg-[#D1D5DB]"
                  }`}
                />
              </span>
              <div className="text-sm font-bold text-[#111827]">
                طلبات بانتظار القبول
              </div>
              <span className="rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold px-2 py-0.5">
                {pendingOrders.length}
              </span>
            </div>
            <Link
              href="/store/orders?status=PENDING"
              className="text-[11px] font-bold text-[#16A34A] hover:underline"
            >
              كل الطلبات ←
            </Link>
          </div>
          <CardContent className="p-0">
            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto h-10 w-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#9CA3AF]" />
                </div>
                <div className="mt-3 text-sm font-bold text-[#111827]">
                  مفيش طلبات جديدة
                </div>
                <div className="text-[11px] text-[#6B7280] mt-1">
                  الطلبات الجديدة هتظهر هنا فوراً مع تنبيه صوتي
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-[#F3F4F6]">
                {pendingOrders.map((o) => (
                  <li
                    key={o.id}
                    className="px-4 py-3 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/store/orders/${o.id}`}
                            className="text-sm font-bold text-[#111827] hover:text-[#16A34A]"
                          >
                            #{o.orderNumber}
                          </Link>
                          <span className="text-[10px] text-[#6B7280]">
                            {formatDistanceToNow(o.createdAt, {
                              addSuffix: true,
                              locale: arEG,
                            })}
                          </span>
                        </div>
                        <div className="text-[12px] text-[#374151] mt-1 truncate">
                          {o.customer.name}
                          <span className="text-[#9CA3AF] mx-1">·</span>
                          {o.customer.phone}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {o.building?.name ?? "—"}
                            {o.address?.floor ? ` · دور ${o.address.floor}` : ""}
                            {o.address?.apartment
                              ? ` · شقة ${o.address.apartment}`
                              : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-sm font-black text-[#111827]">
                          {formatEGP(Number(o.total))}
                        </div>
                        <div className="text-[10px] text-[#6B7280]">
                          {o.items.length} صنف
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <OrderActionButtons
                        orderId={o.id}
                        status={o.status}
                        compact
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Info column */}
        <div className="flex flex-col gap-3">
          <Card className="border-[#E5E7EB] bg-white shadow-none">
            <CardContent className="p-4">
              <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
                معدل العمولة
              </div>
              <div className="mt-2 text-3xl font-black text-[#111827]">
                {formatCommissionRate(commission.currentRate)}
              </div>
              <div className="text-[11px] text-[#6B7280] mt-1">
                من كل طلب يتم توصيله
              </div>
              <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[11px]">
                <span className="text-[#6B7280]">إجمالي محصّل</span>
                <span className="font-bold text-[#111827]">
                  {formatEGP(commission.totalPaid)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-[#6B7280]">طلبات مسواة</span>
                <span className="font-bold text-[#111827]">
                  {commission.ordersSettled}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB] bg-white shadow-none">
            <CardContent className="p-4">
              <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
                اختصارات
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href="/store/orders?status=PENDING"
                  className="text-[11px] font-bold text-[#111827] bg-[#F8FAFC] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-2 py-2 text-center"
                >
                  الطلبات الجديدة
                </Link>
                <Link
                  href="/store/inventory"
                  className="text-[11px] font-bold text-[#111827] bg-[#F8FAFC] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-2 py-2 text-center"
                >
                  المخزون
                </Link>
                <Link
                  href="/store/reports"
                  className="text-[11px] font-bold text-[#111827] bg-[#F8FAFC] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-2 py-2 text-center"
                >
                  التقارير
                </Link>
                <Link
                  href="/store/settings"
                  className="text-[11px] font-bold text-[#111827] bg-[#F8FAFC] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-2 py-2 text-center"
                >
                  الإعدادات
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
