import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { formatEGP } from "@/lib/utils";
import {
  settlementStatusLabel,
  settlementStatusTone,
  settlementMethodLabel,
} from "@/lib/labels";
import { getStoreCommissionSummary } from "@/server/queries/commission";
import { formatCommissionRate } from "@/lib/commission";
import { Wallet } from "lucide-react";

export default async function StoreSettlementsPage() {
  const user = await requireStore();
  const storeId = user.storeId;

  const [summary, settlements] = await Promise.all([
    getStoreCommissionSummary(storeId),
    db.settlement.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التسويات</h1>
        <p className="text-sm text-gray-500">
          سجل التسويات مع منصة بقال
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="الرصيد المستحق"
          value={formatEGP(summary.totalOwed)}
          tone="text-orange-700"
        />
        <StatCard
          label="إجمالي المدفوع"
          value={formatEGP(summary.totalPaid)}
          tone="text-green-700"
        />
        <StatCard
          label="أوردرات غير مسواة"
          value={String(summary.ordersUnsettled)}
          tone="text-gray-900"
        />
        <StatCard
          label="نسبة العمولة"
          value={formatCommissionRate(summary.currentRate)}
          tone="text-gray-900"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>التسويات ({settlements.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {settlements.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<Wallet className="h-6 w-6" />}
                title="لسه مفيش تسويات"
                description="لما المنصة تعمل تسوية للأوردرات المتراكمة هتلاقيها هنا."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">الرقم</th>
                    <th className="px-4 py-3 font-medium">المبلغ</th>
                    <th className="px-4 py-3 font-medium">الأوردرات</th>
                    <th className="px-4 py-3 font-medium">الفترة</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">الطريقة</th>
                    <th className="px-4 py-3 font-medium">تاريخ الدفع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {settlements.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {s.id.slice(0, 8)}
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

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-gray-500">{label}</div>
        <div className={`mt-1 text-xl font-bold ${tone}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
