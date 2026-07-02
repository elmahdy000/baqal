import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "نشط",
  TRIAL: "تجريبي",
  PAST_DUE: "متأخر",
  CANCELLED: "ملغي",
  EXPIRED: "منتهي",
};

const STATUS_TONE: Record<string, "green" | "yellow" | "red" | "default"> = {
  ACTIVE: "green",
  TRIAL: "yellow",
  PAST_DUE: "red",
  CANCELLED: "red",
  EXPIRED: "red",
};

const CYCLE_LABEL: Record<string, string> = {
  MONTHLY: "شهري",
  YEARLY: "سنوي",
};

const TIER_LABEL: Record<string, string> = {
  BASIC: "أساسية",
  PLUS: "بلس",
  PRO: "برو",
  ENTERPRISE: "مؤسسات",
};

const VALID_STATUSES = ["ACTIVE", "TRIAL", "PAST_DUE", "CANCELLED", "EXPIRED"] as const;

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const statusFilter = status && (VALID_STATUSES as readonly string[]).includes(status)
    ? (status as (typeof VALID_STATUSES)[number])
    : null;

  const subs = await db.subscription.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      plan: true,
      store: { select: { id: true, name: true, nameAr: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الاشتراكات</h1>
        <p className="text-sm text-gray-500">اشتراكات البقالات</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/subscriptions"
          className={`rounded-lg border px-3 py-1.5 text-xs ${
            !statusFilter
              ? "border-green-600 bg-green-50 text-green-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          الكل
        </Link>
        {VALID_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/subscriptions?status=${s}`}
            className={`rounded-lg border px-3 py-1.5 text-xs ${
              statusFilter === s
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الاشتراكات ({subs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">البقالة</th>
                  <th className="px-4 py-3 font-medium">الخطة</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">الفوترة</th>
                  <th className="px-4 py-3 font-medium">المبلغ</th>
                  <th className="px-4 py-3 font-medium">التجديد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      لا توجد اشتراكات
                    </td>
                  </tr>
                ) : (
                  subs.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/stores/${s.store.id}`}
                          className="font-medium text-gray-900 hover:text-green-700"
                        >
                          {s.store.nameAr ?? s.store.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.plan.nameAr} ({TIER_LABEL[s.plan.tier] ?? s.plan.tier})
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONE[s.status] ?? "default"}>
                          {STATUS_LABEL[s.status] ?? s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {CYCLE_LABEL[s.billingCycle] ?? s.billingCycle}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {Number(s.amount).toFixed(2)} ج.م
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.renewalDate
                          ? format(s.renewalDate, "yyyy/MM/dd", { locale: arEG })
                          : s.endsAt
                            ? format(s.endsAt, "yyyy/MM/dd", { locale: arEG })
                            : "—"}
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
