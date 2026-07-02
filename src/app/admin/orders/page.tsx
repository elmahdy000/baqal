import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatEGP } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { orderStatusLabel, orderStatusTone } from "@/lib/labels";
import { EmptyState } from "@/components/ui/empty";
import { ShoppingBag } from "lucide-react";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; storeId?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status && (STATUSES as string[]).includes(sp.status)
    ? (sp.status as OrderStatus)
    : undefined;
  const storeId = sp.storeId && sp.storeId !== "all" ? sp.storeId : undefined;

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (storeId) where.storeId = storeId;

  const [orders, stores] = await Promise.all([
    db.order.findMany({
      where,
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { name: true, nameAr: true } },
        customer: { select: { name: true, phone: true } },
      },
    }),
    db.store.findMany({
      select: { id: true, name: true, nameAr: true },
      orderBy: { name: "asc" },
    }),
  ]);

  function buildHref(patch: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { status: sp.status, storeId: sp.storeId, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الطلبات</h1>
        <p className="text-sm text-gray-500">آخر 50 طلب على المنصة</p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>فلترة</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={buildHref({ status: undefined })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                !status ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              الكل
            </Link>
            {STATUSES.map((s) => (
              <Link
                key={s}
                href={buildHref({ status: s })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  status === s
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {orderStatusLabel(s)}
              </Link>
            ))}
          </div>
          <form method="get" className="flex items-center gap-2">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <label className="text-sm text-gray-500">البقالة:</label>
            <select
              name="storeId"
              defaultValue={storeId ?? "all"}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm"
            >
              <option value="all">كل البقالات</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr ?? s.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-9 rounded-lg bg-gray-900 px-3 text-xs font-medium text-white"
            >
              تطبيق
            </button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">رقم الطلب</th>
                  <th className="px-4 py-3 font-medium">البقالة</th>
                  <th className="px-4 py-3 font-medium">العميل</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">المبلغ</th>
                  <th className="px-4 py-3 font-medium">العمولة</th>
                  <th className="px-4 py-3 font-medium">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-0 py-4">
                      <EmptyState
                        icon={<ShoppingBag className="h-6 w-6" />}
                        title="لسه مفيش طلبات"
                        description="أول ما تيجي الطلبات هتلاقيها هنا."
                      />
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {o.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {o.store.nameAr ?? o.store.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{o.customer.name}</div>
                        <div className="text-xs text-gray-500" dir="ltr">
                          {o.customer.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={orderStatusTone(o.status)}>
                          {orderStatusLabel(o.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {formatEGP(Number(o.total))}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {o.status === "DELIVERED" && o.platformCommission != null
                          ? formatEGP(Number(o.platformCommission))
                          : "—"}
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
