import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { storeStatusLabel, storeStatusTone } from "@/lib/labels";
import { formatEGP } from "@/lib/utils";
import { SubscriptionForm } from "./_subscription-form";
import {
  CommissionRateForm,
  CreateSettlementButton,
} from "./_commission-form";
import { getStoreCommissionSummary } from "@/server/queries/commission";
import { formatCommissionRate } from "@/lib/commission";

export default async function AdminStoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const store = await db.store.findUnique({
    where: { id },
    include: {
      buildings: { orderBy: { createdAt: "desc" } },
      qrCodes: { orderBy: { createdAt: "desc" } },
      subscription: { include: { plan: true } },
      _count: { select: { products: true, orders: true, buildings: true, qrCodes: true } },
    },
  });

  if (!store) notFound();

  const plans = await db.plan.findMany({
    orderBy: { priceMonthly: "asc" },
    select: { id: true, nameAr: true, tier: true, priceMonthly: true, priceYearly: true },
  });

  const commissionSummary = await getStoreCommissionSummary(store.id);
  const sub = store.subscription;
  const subInitial = {
    planId: sub?.planId ?? plans[0]?.id ?? "",
    status: (sub?.status ?? "TRIAL") as "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED" | "EXPIRED",
    billingCycle: (sub?.billingCycle ?? "MONTHLY") as "MONTHLY" | "YEARLY",
    amount: sub ? Number(sub.amount) : 0,
  };

  const SUB_STATUS_LABEL: Record<string, string> = {
    ACTIVE: "نشط",
    TRIAL: "تجريبي",
    PAST_DUE: "متأخر",
    CANCELLED: "ملغي",
    EXPIRED: "منتهي",
  };
  const SUB_STATUS_TONE: Record<string, "green" | "yellow" | "red" | "default"> = {
    ACTIVE: "green",
    TRIAL: "yellow",
    PAST_DUE: "red",
    CANCELLED: "red",
    EXPIRED: "red",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {store.nameAr ?? store.name}
          </h1>
          <p className="text-sm text-gray-500">تفاصيل البقالة</p>
        </div>
        <Badge tone={storeStatusTone(store.status)}>
          {storeStatusLabel(store.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>معلومات عامة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Slug" value={store.slug} />
            <Row label="الهاتف" value={store.phone ?? "—"} />
            <Row label="البريد" value={store.email ?? "—"} />
            <Row label="العنوان" value={store.address ?? "—"} />
            <Row label="ساعات العمل" value={store.openingHours ?? "—"} />
            <Row label="رسوم التوصيل" value={formatEGP(Number(store.deliveryFee))} />
            <Row
              label="الحد الأدنى للطلب"
              value={formatEGP(Number(store.minOrderAmount))}
            />
            <Row
              label="تاريخ الإنشاء"
              value={store.createdAt.toLocaleDateString("ar-EG")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإحصائيات</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Stat label="المنتجات" value={store._count.products} />
            <Stat label="الطلبات" value={store._count.orders} />
            <Stat label="العمارات" value={store._count.buildings} />
            <Stat label="أكواد QR" value={store._count.qrCodes} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>العمولة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 text-xs text-gray-500">
              النسبة الحالية:{" "}
              <span className="font-semibold text-gray-900">
                {formatCommissionRate(commissionSummary.currentRate)}
              </span>
            </div>
            <CommissionRateForm
              storeId={store.id}
              initialRate={commissionSummary.currentRate}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label="إجمالي العمولة"
              value={formatEGP(commissionSummary.totalEarnedAllTime)}
            />
            <Stat
              label="رصيد مستحق للمنصة"
              value={formatEGP(commissionSummary.totalOwed)}
            />
            <Stat
              label="إجمالي المحصَّل"
              value={formatEGP(commissionSummary.totalPaid)}
            />
            <Stat
              label="أوردرات غير مسواة"
              value={commissionSummary.ordersUnsettled}
            />
          </div>

          {commissionSummary.totalOwed > 0 && (
            <div className="rounded-lg bg-green-50 p-3">
              <div className="mb-2 text-sm text-green-900">
                يوجد {commissionSummary.ordersUnsettled} طلب غير مسوَّى بإجمالي{" "}
                {formatEGP(commissionSummary.totalOwed)}
              </div>
              <CreateSettlementButton
                storeId={store.id}
                totalOwed={commissionSummary.totalOwed}
                ordersUnsettled={commissionSummary.ordersUnsettled}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الاشتراك</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sub ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm">
              <div>
                <div className="text-xs text-gray-500">الخطة الحالية</div>
                <div className="font-medium text-gray-900">{sub.plan.nameAr}</div>
              </div>
              <Badge tone={SUB_STATUS_TONE[sub.status] ?? "default"}>
                {SUB_STATUS_LABEL[sub.status] ?? sub.status}
              </Badge>
              <div className="text-xs text-gray-500">
                المبلغ: {Number(sub.amount).toFixed(2)} ج.م
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              لا يوجد اشتراك مفعّل لهذه البقالة
            </div>
          )}
          <SubscriptionForm
            storeId={store.id}
            plans={plans.map((p) => ({ id: p.id, nameAr: p.nameAr, tier: p.tier }))}
            initial={subInitial}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>العمارات ({store.buildings.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الاسم</th>
                  <th className="px-4 py-3 font-medium">الكود</th>
                  <th className="px-4 py-3 font-medium">الشارع</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {store.buildings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      لا توجد عمارات
                    </td>
                  </tr>
                ) : (
                  store.buildings.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3 text-gray-900">{b.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-700">{b.code}</td>
                      <td className="px-4 py-3 text-gray-700">{b.street ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge tone={b.isActive ? "green" : "red"}>
                          {b.isActive ? "نشطة" : "موقوفة"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>أكواد QR ({store.qrCodes.length})</CardTitle>
          <Link href="/admin/qrcodes" className="text-sm text-green-700 hover:underline">
            إدارة الأكواد
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الكود</th>
                  <th className="px-4 py-3 font-medium">الرابط</th>
                  <th className="px-4 py-3 font-medium">المسحات</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {store.qrCodes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      لا توجد أكواد
                    </td>
                  </tr>
                ) : (
                  store.qrCodes.map((q) => (
                    <tr key={q.id}>
                      <td className="px-4 py-3 font-mono text-gray-900">{q.code}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs" dir="ltr">
                        {q.url}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{q.scanCount}</td>
                      <td className="px-4 py-3">
                        <Badge tone={q.isActive ? "green" : "red"}>
                          {q.isActive ? "نشط" : "متوقف"}
                        </Badge>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-1.5 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
