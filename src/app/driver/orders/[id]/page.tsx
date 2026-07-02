import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { Phone } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEGP } from "@/lib/utils";
import { orderStatusLabel, orderStatusTone } from "@/lib/labels";
import { DeliveredButton } from "@/components/driver/delivered-button";

export const dynamic = "force-dynamic";

export default async function DriverOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("DELIVERY");
  const { id } = await params;

  const order = await db.order.findFirst({
    where: { id, driverId: user.id },
    include: {
      customer: true,
      building: true,
      address: true,
      items: true,
      history: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/driver"
          className="text-xs text-gray-500 hover:text-green-700"
        >
          ← الرجوع للطلبات
        </Link>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-gray-900">#{order.orderNumber}</h1>
            <div className="text-xs text-gray-500">
              {format(order.createdAt, "yyyy/MM/dd HH:mm", { locale: arEG })}
            </div>
          </div>
          <Badge tone={orderStatusTone(order.status)}>
            {orderStatusLabel(order.status)}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>العميل</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">{order.customer.name}</div>
              <div className="text-xs text-gray-500">{order.customer.phone}</div>
            </div>
            <a
              href={`tel:${order.customer.phone}`}
              className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
            >
              <Phone className="h-4 w-4" />
              <span>اتصال</span>
            </a>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
            <div className="font-medium text-gray-900">{order.building?.name ?? "—"}</div>
            {order.address?.floor && <div>الدور: {order.address.floor}</div>}
            {order.address?.apartment && <div>الشقة: {order.address.apartment}</div>}
            {order.address?.street && <div>{order.address.street}</div>}
            {order.address?.deliveryNotes && (
              <div className="mt-1 italic">ملاحظات: {order.address.deliveryNotes}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>المنتجات ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {order.items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
            >
              <div>
                <div className="font-medium text-gray-900">{it.productNameSnapshot}</div>
                {it.notes && (
                  <div className="text-xs text-[#EA580C] font-extrabold mt-0.5">{it.notes}</div>
                )}
                <div className="text-xs text-gray-500">
                  {it.quantity} × {formatEGP(Number(it.unitPrice))}
                </div>
              </div>
              <div className="font-semibold text-gray-900">
                {formatEGP(Number(it.totalPrice))}
              </div>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 font-semibold">
            <span>الإجمالي</span>
            <span>{formatEGP(Number(order.total))}</span>
          </div>
        </CardContent>
      </Card>

      {order.status === "OUT_FOR_DELIVERY" && (
        <DeliveredButton orderId={order.id} />
      )}
    </div>
  );
}
