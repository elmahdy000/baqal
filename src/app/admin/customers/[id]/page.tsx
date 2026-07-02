import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import { db } from "@/lib/db";
import { formatEGP } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { orderStatusLabel, orderStatusTone } from "@/lib/labels";
import { ArrowRight } from "lucide-react";

// The `[id]` route param here is the customer phone (URL-encoded). A "customer"
// as seen by the platform admin is identified by phone across all stores.
export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const phone = decodeURIComponent(id);

  const customerRows = await db.customer.findMany({
    where: { phone },
    include: {
      store: { select: { id: true, name: true, nameAr: true, slug: true } },
      _count: { select: { orders: true } },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          store: { select: { id: true, name: true, nameAr: true } },
          building: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      addresses: {
        select: {
          id: true,
          buildingName: true,
          floor: true,
          apartment: true,
          street: true,
          deliveryNotes: true,
          isDefault: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (customerRows.length === 0) notFound();

  // Prefer the oldest record's name; that's the first name the customer used.
  const displayName = customerRows[0].name;
  const firstSeenAt = customerRows[0].createdAt;

  // Aggregate per store.
  const perStore = customerRows.map((c) => {
    const orderCount = c.orders.length;
    const spent = c.orders.reduce((s, o) => s + Number(o.total), 0);
    const lastOrder = c.orders[0]?.createdAt ?? null;
    const delivered = c.orders.filter((o) => o.status === "DELIVERED").length;
    const cancelled = c.orders.filter(
      (o) => o.status === "CANCELLED" || o.status === "REJECTED",
    ).length;
    return {
      customerId: c.id,
      store: c.store,
      orderCount,
      totalSpent: spent,
      lastOrderAt: lastOrder,
      delivered,
      cancelled,
    };
  });

  const totalOrders = perStore.reduce((s, x) => s + x.orderCount, 0);
  const totalSpent = perStore.reduce((s, x) => s + x.totalSpent, 0);
  const lastOrderAt = perStore.reduce<Date | null>(
    (max, x) => (x.lastOrderAt && (!max || x.lastOrderAt > max) ? x.lastOrderAt : max),
    null,
  );

  // Merge all orders across stores, newest first.
  const allOrders = customerRows
    .flatMap((c) =>
      c.orders.map((o) => ({
        ...o,
        customerNameForStore: c.name,
      })),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50);

  const addresses = customerRows.flatMap((c) =>
    c.addresses.map((a) => ({ ...a, storeName: c.store.nameAr ?? c.store.name })),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1">
            <Link
              href="/admin/customers"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowRight className="h-4 w-4" />
              <span>رجوع للعملاء</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-sm text-gray-500" dir="ltr">
            {phone}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="عدد البقالات" value={perStore.length} />
        <Stat label="إجمالي الطلبات" value={totalOrders} />
        <Stat label="إجمالي الإنفاق" value={formatEGP(totalSpent)} />
        <Stat
          label="آخر طلب"
          value={
            lastOrderAt
              ? formatDistanceToNow(lastOrderAt, {
                  addSuffix: true,
                  locale: arEG,
                })
              : "—"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>النشاط حسب البقالة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">البقالة</th>
                  <th className="px-4 py-3 font-medium">عدد الطلبات</th>
                  <th className="px-4 py-3 font-medium">مكتملة</th>
                  <th className="px-4 py-3 font-medium">ملغية</th>
                  <th className="px-4 py-3 font-medium">إجمالي الإنفاق</th>
                  <th className="px-4 py-3 font-medium">آخر طلب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {perStore.map((s) => (
                  <tr key={s.customerId}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link
                        href={`/admin/stores/${s.store.id}`}
                        className="hover:underline"
                      >
                        {s.store.nameAr ?? s.store.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.orderCount}</td>
                    <td className="px-4 py-3 text-gray-700">{s.delivered}</td>
                    <td className="px-4 py-3 text-gray-700">{s.cancelled}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {formatEGP(s.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.lastOrderAt
                        ? s.lastOrderAt.toLocaleDateString("ar-EG")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-100 bg-gray-50 text-sm">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    الإجمالي
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {totalOrders}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {perStore.reduce((s, x) => s + x.delivered, 0)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {perStore.reduce((s, x) => s + x.cancelled, 0)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {formatEGP(totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {lastOrderAt
                      ? lastOrderAt.toLocaleDateString("ar-EG")
                      : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>آخر الطلبات ({allOrders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">رقم الطلب</th>
                  <th className="px-4 py-3 font-medium">البقالة</th>
                  <th className="px-4 py-3 font-medium">العمارة</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">المبلغ</th>
                  <th className="px-4 py-3 font-medium">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  allOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {o.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {o.store.nameAr ?? o.store.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {o.building?.name ?? "—"}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>معلومات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="أول ظهور" value={firstSeenAt.toLocaleDateString("ar-EG")} />
            <Row label="عدد البقالات" value={String(perStore.length)} />
            <Row label="إجمالي الطلبات" value={String(totalOrders)} />
            <Row label="إجمالي الإنفاق" value={formatEGP(totalSpent)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>العناوين ({addresses.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {addresses.length === 0 ? (
              <p className="text-gray-500">لا توجد عناوين محفوظة</p>
            ) : (
              addresses.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-gray-100 p-2"
                >
                  <div className="text-xs text-gray-500">{a.storeName}</div>
                  <div className="text-gray-900">
                    {a.buildingName ?? "—"}
                    {a.floor ? ` — الدور ${a.floor}` : ""}
                    {a.apartment ? ` — شقة ${a.apartment}` : ""}
                  </div>
                  {a.street && (
                    <div className="text-xs text-gray-500">{a.street}</div>
                  )}
                  {a.deliveryNotes && (
                    <div className="mt-1 text-xs text-gray-500">
                      {a.deliveryNotes}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
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
    <div className="rounded-lg bg-white border border-gray-100 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
