import Link from "next/link";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEGP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DriverDeliveredPage() {
  const user = await requireRole("DELIVERY");

  const orders = await db.order.findMany({
    where: { driverId: user.id, status: "DELIVERED" },
    include: { customer: true, building: true },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">آخر التوصيلات</h1>
        <p className="text-xs text-gray-500">آخر 30 طلب تم توصيله</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-gray-500">
            لسه مفيش طلبات موصلة
          </CardContent>
        </Card>
      ) : (
        orders.map((o) => (
          <Card key={o.id}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between">
                <Link
                  href={`/driver/orders/${o.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-green-700"
                >
                  #{o.orderNumber}
                </Link>
                <Badge tone="green">تم التوصيل</Badge>
              </div>
              <div className="text-xs text-gray-500">
                {format(o.updatedAt, "yyyy/MM/dd HH:mm", { locale: arEG })}
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-900">{o.customer.name}</div>
                  <div className="text-xs text-gray-500">
                    {o.building?.name ?? "—"}
                  </div>
                </div>
                <div className="font-semibold text-gray-900">
                  {formatEGP(Number(o.total))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
