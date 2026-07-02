import Link from "next/link";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import type { SettlementStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { formatEGP } from "@/lib/utils";
import {
  settlementStatusLabel,
  settlementStatusTone,
  settlementMethodLabel,
} from "@/lib/labels";
import { getPlatformCommissionSummary } from "@/server/queries/commission";
import { Wallet } from "lucide-react";

const STATUSES: SettlementStatus[] = ["PENDING", "PAID", "CANCELLED"];

export default async function AdminSettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status && (STATUSES as string[]).includes(sp.status)
    ? (sp.status as SettlementStatus)
    : undefined;

  const [summary, settlements] = await Promise.all([
    getPlatformCommissionSummary(),
    db.settlement.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: { store: { select: { name: true, nameAr: true } } },
    }),
  ]);

  function buildHref(patch: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { status: sp.status, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `/admin/settlements?${qs}` : "/admin/settlements";
  }

  const stats = [
    {
      label: "إجمالي العمولة المكتسبة",
      value: formatEGP(summary.totalEarnedAllTime),
      tone: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "رصيد لسه لم يُسوَّ",
      value: formatEGP(summary.totalOwedByStores),
      tone: "text-orange-700",
      bg: "bg-orange-50",
    },
    {
      label: "إجمالي المحصَّل",
      value: formatEGP(summary.totalCollected),
      tone: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "قيد التسويات المفتوحة",
      value: formatEGP(summary.totalPending),
      tone: "text-yellow-700",
      bg: "bg-yellow-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التسويات</h1>
        <p className="text-sm text-gray-500">
          إدارة تسويات العمولة مع البقالات
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className={s.bg}>
            <CardContent className="p-4">
              <div className="text-xs text-gray-600">{s.label}</div>
              <div className={`mt-1 text-xl font-bold ${s.tone}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>كل التسويات</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={buildHref({ status: undefined })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                !status
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700"
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
                {settlementStatusLabel(s)}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {settlements.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<Wallet className="h-6 w-6" />}
                title="لسه مفيش تسويات — أنشئ أول تسوية من صفحة البقالة"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">الرقم</th>
                    <th className="px-4 py-3 font-medium">البقالة</th>
                    <th className="px-4 py-3 font-medium">المبلغ</th>
                    <th className="px-4 py-3 font-medium">الأوردرات</th>
                    <th className="px-4 py-3 font-medium">الفترة</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">الطريقة</th>
                    <th className="px-4 py-3 font-medium">تاريخ الدفع</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {settlements.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {s.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {s.store.nameAr ?? s.store.name}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {formatEGP(Number(s.amount))}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.orderCount}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {format(s.fromDate, "yyyy/MM/dd", { locale: arEG })}
                        {" → "}
                        {format(s.toDate, "yyyy/MM/dd", { locale: arEG })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={settlementStatusTone(s.status)}>
                          {settlementStatusLabel(s.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {settlementMethodLabel(s.method)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {s.paidAt
                          ? format(s.paidAt, "yyyy/MM/dd", { locale: arEG })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/settlements/${s.id}`}
                          className="text-sm font-medium text-green-700 hover:underline"
                        >
                          تفاصيل
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
