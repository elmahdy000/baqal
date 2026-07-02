import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEGP } from "@/lib/utils";
import {
  settlementStatusLabel,
  settlementStatusTone,
  settlementMethodLabel,
  orderStatusLabel,
  orderStatusTone,
} from "@/lib/labels";
import { formatCommissionRate } from "@/lib/commission";
import { SettlementActions } from "./_actions";

export default async function AdminSettlementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const settlement = await db.settlement.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true, nameAr: true, slug: true } },
      orders: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { items: true } } },
      },
    },
  });

  if (!settlement) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/settlements"
            className="text-xs text-gray-500 hover:text-green-700"
          >
            ← الرجوع للتسويات
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            تسوية #{settlement.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-gray-500">
            <Link
              href={`/admin/stores/${settlement.store.id}`}
              className="hover:text-green-700"
            >
              {settlement.store.nameAr ?? settlement.store.name}
            </Link>
          </p>
        </div>
        <Badge tone={settlementStatusTone(settlement.status)}>
          {settlementStatusLabel(settlement.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ملخص التسوية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="المبلغ" value={formatEGP(Number(settlement.amount))} />
            <Row label="عدد الأوردرات" value={String(settlement.orderCount)} />
            <Row
              label="من تاريخ"
              value={format(settlement.fromDate, "yyyy/MM/dd", { locale: arEG })}
            />
            <Row
              label="إلى تاريخ"
              value={format(settlement.toDate, "yyyy/MM/dd", { locale: arEG })}
            />
            <Row
              label="طريقة الدفع"
              value={settlementMethodLabel(settlement.method)}
            />
            <Row label="المرجع" value={settlement.reference ?? "—"} />
            <Row
              label="تاريخ الدفع"
              value={
                settlement.paidAt
                  ? format(settlement.paidAt, "yyyy/MM/dd HH:mm", {
                      locale: arEG,
                    })
                  : "—"
              }
            />
            <Row
              label="تاريخ الإنشاء"
              value={format(settlement.createdAt, "yyyy/MM/dd HH:mm", {
                locale: arEG,
              })}
            />
            {settlement.notes && (
              <div className="pt-2">
                <div className="text-xs text-gray-500">ملاحظات</div>
                <div className="mt-1 rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
                  {settlement.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإجراءات</CardTitle>
          </CardHeader>
          <CardContent>
            <SettlementActions
              id={settlement.id}
              status={settlement.status}
              method={settlement.method}
              reference={settlement.reference}
              notes={settlement.notes}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            الأوردرات المشمولة ({settlement.orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">رقم الطلب</th>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-4 py-3 font-medium">الإجمالي</th>
                  <th className="px-4 py-3 font-medium">النسبة</th>
                  <th className="px-4 py-3 font-medium">العمولة</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settlement.orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      لا توجد أوردرات
                    </td>
                  </tr>
                ) : (
                  settlement.orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {o.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {format(o.createdAt, "yyyy/MM/dd HH:mm", {
                          locale: arEG,
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {formatEGP(Number(o.total))}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {o.platformCommissionRate
                          ? formatCommissionRate(Number(o.platformCommissionRate))
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-700">
                        {formatEGP(Number(o.platformCommission ?? 0))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={orderStatusTone(o.status)}>
                          {orderStatusLabel(o.status)}
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
