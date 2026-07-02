import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import { db } from "@/lib/db";
import { formatEGP } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { orderStatusLabel, orderStatusTone } from "@/lib/labels";
import { getPlatformCommissionSummary } from "@/server/queries/commission";
import {
  Store,
  ShoppingBag,
  Building2,
  QrCode,
  Users,
  Coins,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AdminHomePage() {
  const today = startOfToday();

  const [
    totalStores,
    activeStores,
    suspendedStores,
    ordersToday,
    salesTodayAgg,
    buildingsCount,
    qrCount,
    customersCount,
    latestOrders,
    commission,
    commissionTodayAgg,
  ] = await Promise.all([
    db.store.count(),
    db.store.count({ where: { status: "ACTIVE" } }),
    db.store.count({ where: { status: "SUSPENDED" } }),
    db.order.count({ where: { createdAt: { gte: today } } }),
    db.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: today } },
    }),
    db.building.count(),
    db.qRCode.count(),
    db.customer.count(),
    db.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { store: { select: { name: true, nameAr: true } } },
    }),
    getPlatformCommissionSummary(),
    db.order.aggregate({
      where: {
        status: "DELIVERED",
        platformCommission: { not: null },
        createdAt: { gte: today },
      },
      _sum: { platformCommission: true },
    }),
  ]);

  const salesToday = Number(salesTodayAgg._sum.total ?? 0);
  const commissionToday = Number(commissionTodayAgg._sum.platformCommission ?? 0);
  const storesWithBalance = commission.perStore
    .filter((s) => s.owed > 0)
    .slice(0, 5);

  const stats = [
    {
      label: "إجمالي البقالات",
      value: totalStores.toString(),
      icon: Store,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      label: "البقالات النشطة",
      value: activeStores.toString(),
      icon: ShieldCheck,
      color: "bg-green-50 text-green-600 border-green-100",
    },
    {
      label: "البقالات الموقوفة",
      value: suspendedStores.toString(),
      icon: ShieldAlert,
      color: "bg-rose-50 text-rose-600 border-rose-100",
    },
    {
      label: "طلبات اليوم",
      value: ordersToday.toString(),
      icon: ShoppingBag,
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      label: "مبيعات اليوم",
      value: formatEGP(salesToday),
      icon: Coins,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      label: "عدد العمارات",
      value: buildingsCount.toString(),
      icon: Building2,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      label: "أكواد QR",
      value: qrCount.toString(),
      icon: QrCode,
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      label: "عدد العملاء",
      value: customersCount.toString(),
      icon: Users,
      color: "bg-cyan-50 text-cyan-600 border-cyan-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-sm text-gray-500">نظرة عامة على المنصة</p>
      </div>

      {/* Commission KPIs — the primary revenue signal for the platform */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="bg-gray-900 text-white border-gray-900 shadow-sm">
          <CardContent className="p-5">
            <div className="text-[11px] tracking-widest text-white/60">
              إجمالي عمولة المنصة
            </div>
            <div className="mt-2 text-3xl font-black">
              {formatEGP(commission.totalEarnedAllTime)}
            </div>
            <div className="mt-1 text-xs text-white/60">
              من كل الطلبات التي تم توصيلها
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-500 bg-green-50/50 shadow-sm">
          <CardContent className="p-5">
            <div className="text-[11px] tracking-widest text-gray-500">
              مستحقات على البقالات
            </div>
            <div className="mt-2 text-3xl font-black text-gray-900">
              {formatEGP(commission.totalOwedByStores)}
            </div>
            <Link
              href="/admin/settlements"
              className="mt-1 inline-block text-xs text-green-700 font-bold hover:underline"
            >
              فتح صفحة التسويات ←
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="text-[11px] tracking-widest text-gray-500">
              عمولة محصّلة
            </div>
            <div className="mt-2 text-3xl font-black text-gray-900">
              {formatEGP(commission.totalCollected)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              معلّق: {formatEGP(commission.totalPending)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="text-[11px] tracking-widest text-gray-500">
              عمولة اليوم
            </div>
            <div className="mt-2 text-3xl font-black text-gray-900">
              {formatEGP(commissionToday)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              مبيعات اليوم: {formatEGP(salesToday)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 font-medium">{s.label}</div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                </div>
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {storesWithBalance.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>بقالات عليها مستحقات</CardTitle>
            <Link
              href="/admin/settlements"
              className="text-sm text-green-700 hover:underline"
            >
              التسويات
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">البقالة</th>
                    <th className="px-4 py-3 font-medium">النسبة</th>
                    <th className="px-4 py-3 font-medium">إجمالي مكتسب</th>
                    <th className="px-4 py-3 font-medium">مستحق حالياً</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {storesWithBalance.map((s) => (
                    <tr key={s.storeId}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link
                          href={`/admin/stores/${s.storeId}`}
                          className="hover:underline"
                        >
                          {s.storeName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{s.rate}%</td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatEGP(s.earned)}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {formatEGP(s.owed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>آخر الطلبات</CardTitle>
          <Link href="/admin/orders" className="text-sm text-green-700 hover:underline">
            عرض الكل
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">رقم الطلب</th>
                  <th className="px-4 py-3 font-medium">البقالة</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">المبلغ</th>
                  <th className="px-4 py-3 font-medium">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {latestOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      لا توجد طلبات بعد
                    </td>
                  </tr>
                ) : (
                  latestOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{o.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {o.store.nameAr ?? o.store.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={orderStatusTone(o.status)}>
                          {orderStatusLabel(o.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {formatEGP(Number(o.total))}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDistanceToNow(o.createdAt, {
                          addSuffix: true,
                          locale: arEG,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
