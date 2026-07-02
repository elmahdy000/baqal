"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { emitTo } from "@/lib/emit";
import { EVENTS, rooms } from "@/lib/realtime";
import { computeCommission } from "@/lib/commission";
import { sendPushToCustomerPhone } from "@/lib/push";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function markDelivered(orderId: string): Promise<ActionResult> {
  const user = await requireRole("DELIVERY");
  if (!orderId) return { ok: false, error: "معرف الطلب مفقود" };

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { customer: true, store: { select: { platformCommissionRate: true } } },
  });
  if (!order) return { ok: false, error: "الطلب غير موجود" };
  if (order.driverId !== user.id) return { ok: false, error: "غير مسموح" };
  if (order.status !== "OUT_FOR_DELIVERY") {
    return { ok: false, error: "لا يمكن تسليم هذا الطلب" };
  }

  const rate = order.store.platformCommissionRate;
  const commission = computeCommission(order.total, rate);

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "DELIVERED",
        platformCommissionRate: rate,
        platformCommission: commission,
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "DELIVERED",
        note: `تم التوصيل بواسطة ${user.name ?? user.email}`,
        createdBy: user.id,
      },
    });
  });

  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    storeId: order.storeId,
    customerName: order.customer.name,
    total: Number(order.total),
    status: "DELIVERED" as const,
  };

  emitTo(rooms.customer(order.customerId), EVENTS.ORDER_DELIVERED, payload);
  emitTo(rooms.order(order.id), EVENTS.ORDER_DELIVERED, payload);
  emitTo(rooms.store(order.storeId), EVENTS.ORDER_DELIVERED, payload);

  void sendPushToCustomerPhone(order.storeId, order.customer.phone, {
    title: "تم توصيل الطلب",
    body: "شكراً لاستخدامك بقال",
    url: `/orders/${order.id}`,
    tag: `order-${order.id}`,
  });

  revalidatePath("/driver");
  revalidatePath("/driver/delivered");
  revalidatePath(`/driver/orders/${orderId}`);
  return { ok: true };
}
