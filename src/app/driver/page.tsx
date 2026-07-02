import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEGP } from "@/lib/utils";
import { Phone } from "lucide-react";
import { DeliveredButton } from "@/components/driver/delivered-button";

export const dynamic = "force-dynamic";

export default async function DriverHomePage() {
  const user = await requireRole("DELIVERY");

  const orders = await db.order.findMany({
    where: { driverId: user.id, status: "OUT_FOR_DELIVERY" },
    include: {
      customer: true,
      building: true,
      address: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">طلبات التوصيل</h1>
        <p className="text-xs text-gray-500">
          {orders.length > 0 ? `${orders.length} طلب في الطريق` : "لا توجد طلبات حالياً"}
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-gray-500">
            مفيش طلبات مسندة إليك حالياً
          </CardContent>
        </Card>
      ) : (
        orders.map((o) => (
          <Card key={o.id}>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/driver/orders/${o.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-green-700"
                >
                  #{o.orderNumber}
                </Link>
                <Badge tone="orange">في الطريق</Badge>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium text-gray-900">{o.customer.name}</div>
                  <div className="text-xs text-gray-500">{o.customer.phone}</div>
                </div>
                <a
                  href={`tel:${o.customer.phone}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100"
                >
                  <Phone className="h-4 w-4" />
                  <span>اتصال</span>
                </a>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                <div className="font-medium text-gray-900">
                  {o.building?.name ?? "—"}
                </div>
                {o.address?.floor && <div>الدور: {o.address.floor}</div>}
                {o.address?.apartment && <div>الشقة: {o.address.apartment}</div>}
                {o.address?.deliveryNotes && (
                  <div className="mt-1 italic">ملاحظات: {o.address.deliveryNotes}</div>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">الإجمالي</span>
                <span className="font-semibold text-gray-900">{formatEGP(Number(o.total))}</span>
              </div>
              <DeliveredButton orderId={o.id} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
