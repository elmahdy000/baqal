import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatEGP } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { Users } from "lucide-react";

// A "customer" from the platform-admin's viewpoint is a person (identified by
// phone) who may have shopped at multiple stores. The Customer row in the DB is
// per-store, so we aggregate by phone here.

type Row = {
  phone: string;
  name: string;
  storeCount: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: Date | null;
  firstSeenAt: Date;
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; hasOrders?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const sort = sp.sort ?? "recent";
  const hasOrdersFilter = sp.hasOrders === "1";

  const where: Prisma.CustomerWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }
  if (hasOrdersFilter) {
    where.orders = { some: {} };
  }

  // Pull per-store customer rows with per-customer aggregates. We then group
  // by phone in memory to produce the cross-store view.
  const customerRows = await db.customer.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      storeId: true,
      createdAt: true,
      _count: { select: { orders: true } },
      orders: {
        select: {
          total: true,
          createdAt: true,
        },
      },
    },
    take: 2000,
  });

  const byPhone = new Map<string, Row>();
  for (const c of customerRows) {
    const key = c.phone;
    const existing = byPhone.get(key);
    const orderCount = c.orders.length;
    const spent = c.orders.reduce((s, o) => s + Number(o.total), 0);
    const lastOrder = c.orders.reduce<Date | null>(
      (max, o) => (max === null || o.createdAt > max ? o.createdAt : max),
      null,
    );

    if (!existing) {
      byPhone.set(key, {
        phone: c.phone,
        name: c.name,
        storeCount: 1,
        totalOrders: orderCount,
        totalSpent: spent,
        lastOrderAt: lastOrder,
        firstSeenAt: c.createdAt,
      });
    } else {
      existing.storeCount += 1;
      existing.totalOrders += orderCount;
      existing.totalSpent += spent;
      if (lastOrder && (!existing.lastOrderAt || lastOrder > existing.lastOrderAt)) {
        existing.lastOrderAt = lastOrder;
      }
      if (c.createdAt < existing.firstSeenAt) {
        existing.firstSeenAt = c.createdAt;
        existing.name = c.name; // prefer oldest name record
      }
    }
  }

  const rows = Array.from(byPhone.values());
  rows.sort((a, b) => {
    switch (sort) {
      case "spent":
        return b.totalSpent - a.totalSpent;
      case "orders":
        return b.totalOrders - a.totalOrders;
      case "stores":
        return b.storeCount - a.storeCount;
      case "recent":
      default: {
        const la = a.lastOrderAt?.getTime() ?? a.firstSeenAt.getTime();
        const lb = b.lastOrderAt?.getTime() ?? b.firstSeenAt.getTime();
        return lb - la;
      }
    }
  });

  const capped = rows.slice(0, 200);

  function buildHref(patch: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      q: q || undefined,
      sort: sort !== "recent" ? sort : undefined,
      hasOrders: hasOrdersFilter ? "1" : undefined,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `/admin/customers?${qs}` : "/admin/customers";
  }

  const sorts: { key: string; label: string }[] = [
    { key: "recent", label: "الأحدث نشاطًا" },
    { key: "spent", label: "الأعلى إنفاقًا" },
    { key: "orders", label: "الأكثر طلبات" },
    { key: "stores", label: "الأكثر بقالات" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">العملاء</h1>
        <p className="text-sm text-gray-500">
          كل العملاء على المنصة ({rows.length.toLocaleString("ar-EG")})
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>بحث وفلترة</CardTitle>
          <form method="get" className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="ابحث بالاسم أو الهاتف"
              className="h-9 min-w-[220px] flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm"
            />
            <select
              name="sort"
              defaultValue={sort}
              className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm"
            >
              {sorts.map((s) => (
                <option key={s.key} value={s.key}>
                  ترتيب: {s.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input
                type="checkbox"
                name="hasOrders"
                value="1"
                defaultChecked={hasOrdersFilter}
              />
              عندهم طلبات فقط
            </label>
            <button
              type="submit"
              className="h-9 rounded-lg bg-gray-900 px-3 text-xs font-medium text-white"
            >
              تطبيق
            </button>
            {(q || hasOrdersFilter || sort !== "recent") && (
              <Link
                href="/admin/customers"
                className="h-9 rounded-lg bg-gray-100 px-3 text-xs font-medium text-gray-700 leading-9"
              >
                مسح
              </Link>
            )}
          </form>
          <div className="flex flex-wrap items-center gap-2">
            {sorts.map((s) => (
              <Link
                key={s.key}
                href={buildHref({ sort: s.key === "recent" ? undefined : s.key })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  sort === s.key
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الاسم</th>
                  <th className="px-4 py-3 font-medium">الهاتف</th>
                  <th className="px-4 py-3 font-medium">بقالات</th>
                  <th className="px-4 py-3 font-medium">إجمالي الطلبات</th>
                  <th className="px-4 py-3 font-medium">إجمالي الإنفاق</th>
                  <th className="px-4 py-3 font-medium">آخر طلب</th>
                  <th className="px-4 py-3 font-medium">أول ظهور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {capped.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-0 py-4">
                      <EmptyState
                        icon={<Users className="h-6 w-6" />}
                        title="لسه مفيش عملاء"
                        description={
                          q
                            ? "مفيش نتائج مطابقة للبحث."
                            : "أول ما يبدأ العملاء يطلبوا هتلاقيهم هنا."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  capped.map((r) => (
                    <tr
                      key={r.phone}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link
                          href={`/admin/customers/${encodeURIComponent(r.phone)}`}
                          className="block"
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700" dir="ltr">
                        <Link
                          href={`/admin/customers/${encodeURIComponent(r.phone)}`}
                          className="block"
                        >
                          {r.phone}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.storeCount}</td>
                      <td className="px-4 py-3 text-gray-700">{r.totalOrders}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {formatEGP(r.totalSpent)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.lastOrderAt
                          ? r.lastOrderAt.toLocaleDateString("ar-EG")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.firstSeenAt.toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {rows.length > capped.length && (
            <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
              يعرض {capped.length} من إجمالي {rows.length}. ضيّق بالبحث لعرض
              المزيد.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
