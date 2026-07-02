import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEGP } from "@/lib/utils";
import { orderStatusLabel, orderStatusTone } from "@/lib/labels";
import { OrderActionButtons } from "@/components/store/order-action-buttons";
import { AssignDriverForm } from "@/components/store/assign-driver-form";

const PAYMENT_METHOD_AR: Record<string, string> = {
  CASH_ON_DELIVERY: "الدفع عند الاستلام",
  PAY_LATER: "دفع لاحقاً",
  WALLET: "محفظة",
  CARD_LATER: "كارت لاحقاً",
};

const PAYMENT_STATUS_AR: Record<string, string> = {
  UNPAID: "لم يُدفع",
  PAID: "مدفوع",
  PARTIALLY_PAID: "دفع جزئي",
  REFUNDED: "مسترد",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStore();
  const { id } = await params;

  const order = await db.order.findFirst({
    where: { id, storeId: user.storeId },
    include: {
      customer: true,
      building: true,
      address: true,
      items: { include: { product: true } },
      history: { orderBy: { createdAt: "asc" } },
      driver: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) notFound();

  const canAssign = order.status === "PREPARING" || order.status === "OUT_FOR_DELIVERY";
  const drivers = canAssign
    ? await db.user.findMany({
        where: { storeId: user.storeId, role: "DELIVERY", isActive: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/store/orders"
            className="text-xs text-gray-500 hover:text-green-700"
          >
            ← الرجوع للطلبات
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            طلب #{order.orderNumber}
          </h1>
          <div className="text-xs text-gray-500">
            {format(order.createdAt, "yyyy/MM/dd HH:mm", { locale: arEG })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={orderStatusTone(order.status)}>
            {orderStatusLabel(order.status)}
          </Badge>
          <OrderActionButtons orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>المنتجات</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {order.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {it.product.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.product.imageUrl}
                        alt={it.productNameSnapshot}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {it.productNameSnapshot}
                    </div>
                    <div className="text-xs text-gray-500">
                      {it.quantity} × {formatEGP(Number(it.unitPrice))}
                    </div>
                    {it.notes && (
                      <div className="text-xs text-gray-500 italic">{it.notes}</div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatEGP(Number(it.totalPrice))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>مسار الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              {order.history.length === 0 ? (
                <div className="text-sm text-gray-500">لا توجد أحداث بعد</div>
              ) : (
                <ol className="flex flex-col gap-3">
                  {order.history.map((h) => (
                    <li key={h.id} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge tone={orderStatusTone(h.status)}>
                            {orderStatusLabel(h.status)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(h.createdAt, "yyyy/MM/dd HH:mm", { locale: arEG })}
                          </span>
                        </div>
                        {h.note && (
                          <div className="text-xs text-gray-600 mt-1">{h.note}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {canAssign && (
            <Card>
              <CardHeader>
                <CardTitle>تعيين للسائق</CardTitle>
              </CardHeader>
              <CardContent>
                {order.driver && (
                  <div className="mb-3 rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
                    السائق الحالي:{" "}
                    <span className="font-medium text-gray-900">
                      {order.driver.name ?? order.driver.email}
                    </span>
                  </div>
                )}
                <AssignDriverForm
                  orderId={order.id}
                  currentDriverId={order.driverId ?? ""}
                  drivers={drivers.map((d) => ({
                    id: d.id,
                    label: d.name ?? d.email,
                  }))}
                />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>العميل</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700">
              <div className="font-medium">{order.customer.name}</div>
              <div className="text-gray-500">{order.customer.phone}</div>
              <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-600">
                <div>{order.building?.name ?? "—"}</div>
                {order.address?.floor && <div>الدور: {order.address.floor}</div>}
                {order.address?.apartment && <div>الشقة: {order.address.apartment}</div>}
                {order.address?.street && <div>{order.address.street}</div>}
                {order.address?.deliveryNotes && (
                  <div className="italic mt-1">ملاحظات: {order.address.deliveryNotes}</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الحساب</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">الإجمالي الفرعي</span>
                <span>{formatEGP(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">التوصيل</span>
                <span>{formatEGP(Number(order.deliveryFee))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">خصم</span>
                <span>- {formatEGP(Number(order.discount))}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 mt-2 pt-2 font-semibold">
                <span>الإجمالي</span>
                <span>{formatEGP(Number(order.total))}</span>
              </div>
              {order.status === "DELIVERED" && order.platformCommission != null && (
                <div className="flex justify-between text-xs text-gray-500 pt-1">
                  <span>عمولة المنصة</span>
                  <span>{formatEGP(Number(order.platformCommission))}</span>
                </div>
              )}
              <div className="mt-3 flex flex-col gap-1 text-xs text-gray-500">
                <div>طريقة الدفع: {PAYMENT_METHOD_AR[order.paymentMethod] ?? order.paymentMethod}</div>
                <div>حالة الدفع: {PAYMENT_STATUS_AR[order.paymentStatus] ?? order.paymentStatus}</div>
              </div>
              {order.rejectReason && (
                <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">
                  سبب الرفض: {order.rejectReason}
                </div>
              )}
              {order.notes && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                  ملاحظات العميل: {order.notes}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
