"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import {
  productSchema,
  categorySchema,
  offerSchema,
  customRequestReplySchema,
} from "@/lib/validators";
import { emitTo } from "@/lib/emit";
import { EVENTS, rooms } from "@/lib/realtime";
import { computeCommission } from "@/lib/commission";
import { auditLog } from "@/lib/audit";
import { sendPushToCustomerPhone } from "@/lib/push";
import { canAddProduct, canAddStoreUser, canAddBuilding } from "@/lib/plan-gating";
import { generateBuildingCode } from "@/lib/utils";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// ---------- Products ----------

export async function createProduct(input: unknown): Promise<ActionResult> {
  const user = await requireStore();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const data = parsed.data;

  const gate = await canAddProduct(user.storeId);
  if (!gate.allowed) {
    throw new Error(gate.reason ?? "غير مسموح بإضافة منتج جديد");
  }

  if (data.categoryId) {
    const cat = await db.category.findFirst({
      where: { id: data.categoryId, storeId: user.storeId },
    });
    if (!cat) return { ok: false, error: "التصنيف غير موجود" };
  }

  const createdProduct = await db.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        description: data.description,
        categoryId: data.categoryId ?? null,
        price: data.price,
        discountPrice: data.discountPrice ?? null,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        imageUrl: data.imageUrl ?? null,
        isAvailable: data.isAvailable,
        lowStockThreshold: data.lowStockThreshold,
        storeId: user.storeId,
      },
    });

    if (data.stockQuantity > 0) {
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          storeId: user.storeId,
          type: "STOCK_IN",
          quantity: data.stockQuantity,
          oldQuantity: 0,
          newQuantity: data.stockQuantity,
          reason: "إضافة منتج جديد",
          createdBy: user.id,
        },
      });
    }
    return product;
  });

  await auditLog({
    userId: user.id,
    action: "PRODUCT_CREATED",
    entity: "Product",
    entityId: createdProduct.id,
    metadata: { name: createdProduct.name, storeId: user.storeId },
  });

  revalidatePath("/store/products");
  revalidatePath("/store/inventory");
  redirect("/store/products");
}

export async function updateProduct(id: string, input: unknown): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف منتج مفقود" };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const data = parsed.data;

  const existing = await db.product.findFirst({
    where: { id, storeId: user.storeId },
  });
  if (!existing) return { ok: false, error: "المنتج غير موجود" };

  if (data.categoryId) {
    const cat = await db.category.findFirst({
      where: { id: data.categoryId, storeId: user.storeId },
    });
    if (!cat) return { ok: false, error: "التصنيف غير موجود" };
  }

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        description: data.description,
        categoryId: data.categoryId ?? null,
        price: data.price,
        discountPrice: data.discountPrice ?? null,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        imageUrl: data.imageUrl ?? null,
        isAvailable: data.isAvailable,
        lowStockThreshold: data.lowStockThreshold,
      },
    });

    if (existing.stockQuantity !== data.stockQuantity) {
      await tx.inventoryMovement.create({
        data: {
          productId: id,
          storeId: user.storeId,
          type: "MANUAL_ADJUSTMENT",
          quantity: data.stockQuantity - existing.stockQuantity,
          oldQuantity: existing.stockQuantity,
          newQuantity: data.stockQuantity,
          reason: "تعديل يدوي للمخزون",
          createdBy: user.id,
        },
      });
    }
  });

  await auditLog({
    userId: user.id,
    action: "PRODUCT_UPDATED",
    entity: "Product",
    entityId: id,
    metadata: { name: data.name, storeId: user.storeId },
  });

  revalidatePath("/store/products");
  revalidatePath("/store/inventory");
  redirect("/store/products");
}

/**
 * Quick stock adjustment from the inventory page.
 * `mode`: 'add' adds to current stock, 'remove' subtracts, 'set' overwrites.
 */
export async function adjustStock(input: {
  productId: string;
  mode: "add" | "remove" | "set";
  amount: number;
  reason?: string;
  reasonType?:
    | "STOCK_IN"
    | "STOCK_OUT"
    | "MANUAL_ADJUSTMENT"
    | "DAMAGED"
    | "EXPIRED"
    | "RETURNED";
}): Promise<ActionResult<{ oldQuantity: number; newQuantity: number }>> {
  const user = await requireStore();
  const amount = Number(input.amount);
  if (!input.productId) return { ok: false, error: "معرف المنتج مفقود" };
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "الكمية غير صالحة" };
  }
  if (!["add", "remove", "set"].includes(input.mode)) {
    return { ok: false, error: "نوع التعديل غير صالح" };
  }

  const product = await db.product.findFirst({
    where: { id: input.productId, storeId: user.storeId },
  });
  if (!product) return { ok: false, error: "المنتج غير موجود" };

  const oldQuantity = product.stockQuantity;
  let newQuantity: number;
  if (input.mode === "add") newQuantity = oldQuantity + Math.floor(amount);
  else if (input.mode === "remove")
    newQuantity = Math.max(0, oldQuantity - Math.floor(amount));
  else newQuantity = Math.max(0, Math.floor(amount));

  if (newQuantity === oldQuantity) {
    return { ok: false, error: "الكمية لم تتغير" };
  }

  const delta = newQuantity - oldQuantity;
  const type =
    input.reasonType ??
    (input.mode === "add"
      ? "STOCK_IN"
      : input.mode === "remove"
        ? "STOCK_OUT"
        : "MANUAL_ADJUSTMENT");

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: newQuantity,
        isAvailable: newQuantity === 0 ? false : product.isAvailable,
      },
    });
    await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        storeId: user.storeId,
        type,
        quantity: delta,
        oldQuantity,
        newQuantity,
        reason: input.reason?.trim() || null,
        createdBy: user.id,
      },
    });
  });

  await auditLog({
    userId: user.id,
    action: "STOCK_ADJUSTED",
    entity: "Product",
    entityId: product.id,
    metadata: {
      name: product.name,
      storeId: user.storeId,
      oldQuantity,
      newQuantity,
      delta,
      mode: input.mode,
      type,
    },
  });

  revalidatePath("/store/inventory");
  revalidatePath("/store/products");
  return { ok: true, data: { oldQuantity, newQuantity } };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف منتج مفقود" };

  const product = await db.product.findFirst({
    where: { id, storeId: user.storeId },
  });
  if (!product) return { ok: false, error: "المنتج غير موجود" };

  await db.product.delete({ where: { id } });

  await auditLog({
    userId: user.id,
    action: "PRODUCT_DELETED",
    entity: "Product",
    entityId: id,
    metadata: { name: product.name, storeId: user.storeId },
  });

  revalidatePath("/store/products");
  revalidatePath("/store/inventory");
  return { ok: true };
}

export async function duplicateProduct(id: string): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف منتج مفقود" };

  const gate = await canAddProduct(user.storeId);
  if (!gate.allowed) {
    throw new Error(gate.reason ?? "غير مسموح بإضافة منتج جديد");
  }

  const product = await db.product.findFirst({
    where: { id, storeId: user.storeId },
  });
  if (!product) return { ok: false, error: "المنتج غير موجود" };

  await db.product.create({
    data: {
      name: `${product.name} (نسخة)`,
      nameAr: product.nameAr ? `${product.nameAr} (نسخة)` : null,
      description: product.description,
      categoryId: product.categoryId,
      price: product.price,
      discountPrice: product.discountPrice,
      stockQuantity: 0,
      unit: product.unit,
      imageUrl: product.imageUrl,
      isAvailable: false,
      lowStockThreshold: product.lowStockThreshold,
      storeId: user.storeId,
    },
  });

  revalidatePath("/store/products");
  return { ok: true };
}

export async function toggleProductAvailable(id: string): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف منتج مفقود" };

  const product = await db.product.findFirst({
    where: { id, storeId: user.storeId },
  });
  if (!product) return { ok: false, error: "المنتج غير موجود" };

  await db.product.update({
    where: { id },
    data: { isAvailable: !product.isAvailable },
  });

  revalidatePath("/store/products");
  return { ok: true };
}

// ---------- Orders ----------

async function loadOrderForStore(orderId: string, storeId: string) {
  return db.order.findFirst({
    where: { id: orderId, storeId },
    include: {
      items: true,
      customer: true,
    },
  });
}

function buildOrderPayload(o: {
  id: string;
  orderNumber: string;
  storeId: string;
  customer: { name: string };
  total: Prisma.Decimal;
  status: OrderStatus;
}) {
  return {
    orderId: o.id,
    orderNumber: o.orderNumber,
    storeId: o.storeId,
    customerName: o.customer.name,
    total: Number(o.total),
    status: o.status,
  };
}

export async function acceptOrder(orderId: string, note?: string): Promise<ActionResult> {
  const user = await requireStore();
  const order = await loadOrderForStore(orderId, user.storeId);
  if (!order) return { ok: false, error: "الطلب غير موجود" };
  if (order.status !== "PENDING") return { ok: false, error: "لا يمكن قبول هذا الطلب" };

  // Atomic: decrement stock, mark accepted, log history, log inventory movements
  const lowStockAlerts: { productId: string; name: string; newQty: number; threshold: number }[] = [];
  const outOfStockAlerts: { productId: string; name: string }[] = [];

  await db.$transaction(async (tx) => {
    for (const item of order.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;
      const newQty = Math.max(0, product.stockQuantity - item.quantity);
      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: newQty,
          isAvailable: newQty === 0 ? false : product.isAvailable,
        },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          storeId: user.storeId,
          type: "ORDER_RESERVED",
          quantity: -item.quantity,
          oldQuantity: product.stockQuantity,
          newQuantity: newQty,
          reason: `طلب ${order.orderNumber}`,
          createdBy: user.id,
        },
      });
      if (newQty === 0) {
        outOfStockAlerts.push({ productId: product.id, name: product.nameAr ?? product.name });
      } else if (newQty <= product.lowStockThreshold) {
        lowStockAlerts.push({
          productId: product.id,
          name: product.nameAr ?? product.name,
          newQty,
          threshold: product.lowStockThreshold,
        });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: "ACCEPTED" },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "ACCEPTED",
        note: note ?? null,
        createdBy: user.id,
      },
    });

    for (const alert of outOfStockAlerts) {
      await tx.notification.create({
        data: {
          storeId: user.storeId,
          title: "نفاد المخزون",
          body: `المنتج "${alert.name}" نفد من المخزون`,
          type: "OUT_OF_STOCK",
          data: { productId: alert.productId },
        },
      });
    }
    for (const alert of lowStockAlerts) {
      await tx.notification.create({
        data: {
          storeId: user.storeId,
          title: "مخزون منخفض",
          body: `المنتج "${alert.name}" — باقي ${alert.newQty}`,
          type: "LOW_STOCK",
          data: { productId: alert.productId, newQty: alert.newQty },
        },
      });
    }
  });

  const updated = await loadOrderForStore(orderId, user.storeId);
  if (updated) {
    const payload = buildOrderPayload(updated);
    emitTo(rooms.customer(updated.customerId), EVENTS.ORDER_ACCEPTED, payload);
    emitTo(rooms.order(updated.id), EVENTS.ORDER_ACCEPTED, payload);
    emitTo(rooms.store(user.storeId), EVENTS.ORDER_ACCEPTED, payload);

    void sendPushToCustomerPhone(user.storeId, updated.customer.phone, {
      title: "تم قبول طلبك",
      body: "البقال قبل الطلب وبدأ يجهزه",
      url: `/orders/${updated.id}`,
      tag: `order-${updated.id}`,
    });
  }

  for (const alert of outOfStockAlerts) {
    emitTo(rooms.store(user.storeId), EVENTS.INVENTORY_OUT_OF_STOCK, alert);
  }
  for (const alert of lowStockAlerts) {
    emitTo(rooms.store(user.storeId), EVENTS.INVENTORY_LOW_STOCK, alert);
  }

  await auditLog({
    userId: user.id,
    action: "ORDER_ACCEPTED",
    entity: "Order",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber, storeId: user.storeId },
  });

  revalidatePath("/store/orders");
  revalidatePath(`/store/orders/${orderId}`);
  revalidatePath("/store");
  revalidatePath("/store/inventory");
  return { ok: true };
}

export async function rejectOrder(orderId: string, reason: string): Promise<ActionResult> {
  const user = await requireStore();
  const order = await loadOrderForStore(orderId, user.storeId);
  if (!order) return { ok: false, error: "الطلب غير موجود" };
  if (!["PENDING", "ACCEPTED"].includes(order.status)) {
    return { ok: false, error: "لا يمكن رفض هذا الطلب" };
  }

  const wasAccepted = order.status === "ACCEPTED";

  await db.$transaction(async (tx) => {
    // Restore stock if previously decremented
    if (wasAccepted) {
      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const newQty = product.stockQuantity + item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: newQty },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            storeId: user.storeId,
            type: "ORDER_CANCELLED",
            quantity: item.quantity,
            oldQuantity: product.stockQuantity,
            newQuantity: newQty,
            reason: `رفض طلب ${order.orderNumber}`,
            createdBy: user.id,
          },
        });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: "REJECTED", rejectReason: reason },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "REJECTED",
        note: reason,
        createdBy: user.id,
      },
    });
  });

  const updated = await loadOrderForStore(orderId, user.storeId);
  if (updated) {
    const payload = { ...buildOrderPayload(updated), reason };
    emitTo(rooms.customer(updated.customerId), EVENTS.ORDER_REJECTED, payload);
    emitTo(rooms.order(updated.id), EVENTS.ORDER_REJECTED, payload);
    emitTo(rooms.store(user.storeId), EVENTS.ORDER_REJECTED, payload);

    void sendPushToCustomerPhone(user.storeId, updated.customer.phone, {
      title: "تم رفض الطلب",
      body: reason || "البقال معتذر عن الطلب",
      url: `/orders/${updated.id}`,
      tag: `order-${updated.id}`,
    });
  }

  await auditLog({
    userId: user.id,
    action: "ORDER_REJECTED",
    entity: "Order",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber, reason, storeId: user.storeId },
  });

  revalidatePath("/store/orders");
  revalidatePath(`/store/orders/${orderId}`);
  revalidatePath("/store");
  return { ok: true };
}

const STATUS_EVENT: Record<OrderStatus, string> = {
  PENDING: EVENTS.ORDER_NEW,
  ACCEPTED: EVENTS.ORDER_ACCEPTED,
  PREPARING: EVENTS.ORDER_PREPARING,
  OUT_FOR_DELIVERY: EVENTS.ORDER_OUT_FOR_DELIVERY,
  DELIVERED: EVENTS.ORDER_DELIVERED,
  CANCELLED: EVENTS.ORDER_CANCELLED,
  REJECTED: EVENTS.ORDER_REJECTED,
};

// Which transitions are allowed from the store side
const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
};

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string
): Promise<ActionResult> {
  const user = await requireStore();

  // Delegate special transitions
  if (status === "ACCEPTED") return acceptOrder(orderId, note);
  if (status === "REJECTED") return rejectOrder(orderId, note ?? "بدون سبب");

  const order = await loadOrderForStore(orderId, user.storeId);
  if (!order) return { ok: false, error: "الطلب غير موجود" };

  const allowed = ALLOWED_NEXT[order.status];
  if (!allowed.includes(status)) {
    return { ok: false, error: "انتقال حالة غير مسموح" };
  }

  const shouldRestoreStock = status === "CANCELLED" &&
    ["ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY"].includes(order.status);

  let commissionData: { platformCommissionRate: Prisma.Decimal; platformCommission: number } | null = null;
  if (status === "DELIVERED") {
    const store = await db.store.findUnique({
      where: { id: user.storeId },
      select: { platformCommissionRate: true },
    });
    if (store) {
      const rate = store.platformCommissionRate;
      commissionData = {
        platformCommissionRate: rate,
        platformCommission: computeCommission(order.total, rate),
      };
    }
  }

  await db.$transaction(async (tx) => {
    if (shouldRestoreStock) {
      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const newQty = product.stockQuantity + item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: newQty },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            storeId: user.storeId,
            type: "ORDER_CANCELLED",
            quantity: item.quantity,
            oldQuantity: product.stockQuantity,
            newQuantity: newQty,
            reason: `إلغاء طلب ${order.orderNumber}`,
            createdBy: user.id,
          },
        });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status,
        ...(commissionData ? {
          platformCommissionRate: commissionData.platformCommissionRate,
          platformCommission: commissionData.platformCommission,
        } : {}),
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status,
        note: note ?? null,
        createdBy: user.id,
      },
    });
  });

  const updated = await loadOrderForStore(orderId, user.storeId);
  if (updated) {
    const payload = buildOrderPayload(updated);
    const event = STATUS_EVENT[status];
    emitTo(rooms.customer(updated.customerId), event, payload);
    emitTo(rooms.order(updated.id), event, payload);
    emitTo(rooms.store(user.storeId), event, payload);

    const customerPushMap: Partial<Record<OrderStatus, { title: string; body: string }>> = {
      PREPARING: { title: "طلبك بيتجهز", body: "البقال بدأ يجهز طلبك دلوقتي" },
      OUT_FOR_DELIVERY: { title: "الدليفري طالعلك", body: "طلبك في الطريق لباب الشقة" },
      DELIVERED: { title: "تم توصيل الطلب", body: "شكراً لاستخدامك بقال" },
      CANCELLED: { title: "تم إلغاء الطلب", body: note || "الطلب اتلغى" },
    };
    const pushPayload = customerPushMap[status];
    if (pushPayload) {
      void sendPushToCustomerPhone(user.storeId, updated.customer.phone, {
        ...pushPayload,
        url: `/orders/${updated.id}`,
        tag: `order-${updated.id}`,
      });
    }
  }

  await auditLog({
    userId: user.id,
    action: "ORDER_STATUS_CHANGED",
    entity: "Order",
    entityId: orderId,
    metadata: { orderNumber: order.orderNumber, from: order.status, to: status, storeId: user.storeId },
  });

  revalidatePath("/store/orders");
  revalidatePath(`/store/orders/${orderId}`);
  revalidatePath("/store");
  if (shouldRestoreStock) revalidatePath("/store/inventory");
  return { ok: true };
}

// ---------- Store settings ----------

export async function toggleStoreOpen(): Promise<ActionResult> {
  const user = await requireStore();
  const store = await db.store.findUnique({ where: { id: user.storeId } });
  if (!store) return { ok: false, error: "البقالة غير موجودة" };

  await db.store.update({
    where: { id: user.storeId },
    data: { isOpen: !store.isOpen },
  });

  await auditLog({
    userId: user.id,
    action: "STORE_OPEN_TOGGLED",
    entity: "Store",
    entityId: user.storeId,
    metadata: { from: store.isOpen, to: !store.isOpen },
  });

  revalidatePath("/store");
  revalidatePath("/store/settings");
  return { ok: true };
}

export async function updateStoreSettings(input: unknown): Promise<ActionResult> {
  const user = await requireStore();
  const shape = input as Record<string, unknown>;

  const name = typeof shape.name === "string" ? shape.name.trim() : "";
  const nameAr = typeof shape.nameAr === "string" ? shape.nameAr.trim() : "";
  const phone = typeof shape.phone === "string" ? shape.phone.trim() : "";
  const openingHours = typeof shape.openingHours === "string" ? shape.openingHours.trim() : "";
  const deliveryFee = Number(shape.deliveryFee);
  const minOrderAmount = Number(shape.minOrderAmount);

  if (name.length < 2) return { ok: false, error: "اسم البقالة قصير" };
  if (Number.isNaN(deliveryFee) || deliveryFee < 0) return { ok: false, error: "رسوم التوصيل غير صالحة" };
  if (Number.isNaN(minOrderAmount) || minOrderAmount < 0) return { ok: false, error: "الحد الأدنى غير صالح" };

  await db.store.update({
    where: { id: user.storeId },
    data: {
      name,
      nameAr: nameAr || null,
      phone: phone || null,
      openingHours: openingHours || null,
      deliveryFee,
      minOrderAmount,
    },
  });

  await auditLog({
    userId: user.id,
    action: "STORE_SETTINGS_UPDATED",
    entity: "Store",
    entityId: user.storeId,
    metadata: { name, deliveryFee, minOrderAmount },
  });

  revalidatePath("/store/settings");
  revalidatePath("/store");
  return { ok: true };
}

// ---------- Categories ----------

export async function createCategory(input: unknown): Promise<ActionResult> {
  const user = await requireStore();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const data = parsed.data;

  const existing = await db.category.findFirst({
    where: { storeId: user.storeId, slug: data.slug },
  });
  if (existing) return { ok: false, error: "المعرف مستخدم بالفعل" };

  await db.category.create({
    data: {
      storeId: user.storeId,
      name: data.nameAr,
      nameAr: data.nameAr,
      slug: data.slug,
      icon: data.icon ?? null,
      order: data.order,
    },
  });

  revalidatePath("/store/categories");
  revalidatePath("/store/products");
  return { ok: true };
}

export async function updateCategory(id: string, input: unknown): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف فئة مفقود" };
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const data = parsed.data;

  const cat = await db.category.findFirst({ where: { id, storeId: user.storeId } });
  if (!cat) return { ok: false, error: "الفئة غير موجودة" };

  if (data.slug !== cat.slug) {
    const dupe = await db.category.findFirst({
      where: { storeId: user.storeId, slug: data.slug, NOT: { id } },
    });
    if (dupe) return { ok: false, error: "المعرف مستخدم بالفعل" };
  }

  await db.category.update({
    where: { id },
    data: {
      name: data.nameAr,
      nameAr: data.nameAr,
      slug: data.slug,
      icon: data.icon ?? null,
      order: data.order,
    },
  });

  revalidatePath("/store/categories");
  revalidatePath("/store/products");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف فئة مفقود" };

  const cat = await db.category.findFirst({ where: { id, storeId: user.storeId } });
  if (!cat) return { ok: false, error: "الفئة غير موجودة" };

  await db.$transaction(async (tx) => {
    await tx.product.updateMany({
      where: { categoryId: id, storeId: user.storeId },
      data: { categoryId: null },
    });
    await tx.category.delete({ where: { id } });
  });

  revalidatePath("/store/categories");
  revalidatePath("/store/products");
  return { ok: true };
}

// ---------- Offers ----------

export async function createOffer(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireStore();
  const parsed = offerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const data = parsed.data;

  // Verify product ownership
  if (data.productIds.length > 0) {
    const owned = await db.product.findMany({
      where: { id: { in: data.productIds }, storeId: user.storeId },
      select: { id: true },
    });
    if (owned.length !== data.productIds.length) {
      return { ok: false, error: "بعض المنتجات غير موجودة" };
    }
  }

  const created = await db.offer.create({
    data: {
      storeId: user.storeId,
      title: data.title,
      description: data.description ?? null,
      imageUrl: data.imageUrl ? data.imageUrl : null,
      discountPct: data.discountPct ?? null,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
      isActive: data.isActive,
      productIds: data.productIds,
    },
  });

  revalidatePath("/store/offers");
  return { ok: true, data: { id: created.id } };
}

export async function updateOffer(id: string, input: unknown): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف عرض مفقود" };
  const parsed = offerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const data = parsed.data;

  const existing = await db.offer.findFirst({ where: { id, storeId: user.storeId } });
  if (!existing) return { ok: false, error: "العرض غير موجود" };

  if (data.productIds.length > 0) {
    const owned = await db.product.findMany({
      where: { id: { in: data.productIds }, storeId: user.storeId },
      select: { id: true },
    });
    if (owned.length !== data.productIds.length) {
      return { ok: false, error: "بعض المنتجات غير موجودة" };
    }
  }

  await db.offer.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description ?? null,
      imageUrl: data.imageUrl ? data.imageUrl : null,
      discountPct: data.discountPct ?? null,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
      isActive: data.isActive,
      productIds: data.productIds,
    },
  });

  revalidatePath("/store/offers");
  revalidatePath(`/store/offers/${id}/edit`);
  return { ok: true };
}

export async function deleteOffer(id: string): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف عرض مفقود" };

  const existing = await db.offer.findFirst({ where: { id, storeId: user.storeId } });
  if (!existing) return { ok: false, error: "العرض غير موجود" };

  await db.offer.delete({ where: { id } });
  revalidatePath("/store/offers");
  return { ok: true };
}

// ---------- Custom Requests (store side) ----------

export async function replyToCustomRequest(
  id: string,
  reply: string,
  status: "ANSWERED_AVAILABLE" | "ANSWERED_UNAVAILABLE" | "ANSWERED_SOON"
): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف الطلب مفقود" };

  const parsed = customRequestReplySchema.safeParse({ reply, status });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const req = await db.customRequest.findFirst({ where: { id, storeId: user.storeId } });
  if (!req) return { ok: false, error: "الطلب غير موجود" };

  await db.customRequest.update({
    where: { id },
    data: { reply: parsed.data.reply, status: parsed.data.status },
  });

  revalidatePath("/store/custom-requests");
  return { ok: true };
}

// ---------- Drivers ----------

export async function assignDriver(orderId: string, driverId: string): Promise<ActionResult> {
  const user = await requireStore();
  if (!orderId) return { ok: false, error: "معرف الطلب مفقود" };
  if (!driverId) return { ok: false, error: "اختر سائق" };

  const order = await db.order.findFirst({
    where: { id: orderId, storeId: user.storeId },
  });
  if (!order) return { ok: false, error: "الطلب غير موجود" };

  const driver = await db.user.findFirst({
    where: { id: driverId, storeId: user.storeId, role: "DELIVERY", isActive: true },
  });
  if (!driver) return { ok: false, error: "السائق غير موجود" };

  await db.order.update({
    where: { id: orderId },
    data: { driverId },
  });

  await db.orderStatusHistory.create({
    data: {
      orderId,
      status: order.status,
      note: `تعيين للسائق ${driver.name ?? driver.email}`,
      createdBy: user.id,
    },
  });

  revalidatePath(`/store/orders/${orderId}`);
  revalidatePath("/store/orders");
  revalidatePath("/driver");
  return { ok: true };
}

export async function createDriver(input: unknown): Promise<ActionResult> {
  const user = await requireStore();
  const shape = input as Record<string, unknown>;
  const email = typeof shape.email === "string" ? shape.email.trim().toLowerCase() : "";
  const name = typeof shape.name === "string" ? shape.name.trim() : "";
  const phone = typeof shape.phone === "string" ? shape.phone.trim() : "";
  const password = typeof shape.password === "string" ? shape.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "بريد إلكتروني غير صالح" };
  if (name.length < 2) return { ok: false, error: "الاسم مطلوب" };
  if (password.length < 6) return { ok: false, error: "كلمة السر 6 حروف على الأقل" };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "الإيميل ده مستخدم قبل كده" };

  const gate = await canAddStoreUser(user.storeId);
  if (!gate.allowed) {
    return { ok: false, error: gate.reason ?? "غير مسموح بإضافة مستخدم جديد" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({
    data: {
      email,
      name,
      phone: phone || null,
      passwordHash,
      role: "DELIVERY",
      storeId: user.storeId,
      isActive: true,
    },
  });

  revalidatePath("/store/drivers");
  return { ok: true };
}

export async function toggleDriverActive(id: string): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف السائق مفقود" };

  const driver = await db.user.findFirst({
    where: { id, storeId: user.storeId, role: "DELIVERY" },
  });
  if (!driver) return { ok: false, error: "السائق غير موجود" };

  await db.user.update({
    where: { id },
    data: { isActive: !driver.isActive },
  });

  revalidatePath("/store/drivers");
  return { ok: true };
}

// ---------- Buildings (store-scoped) ----------

type BuildingInput = {
  name?: string;
  street?: string;
  buildingNumber?: string;
  compoundName?: string;
  deliveryFee?: number | string | null;
};

export async function createBuilding(
  input: BuildingInput
): Promise<ActionResult<{ id: string; code: string }>> {
  const user = await requireStore();
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 2) return { ok: false, error: "اسم العمارة مطلوب" };

  const gate = await canAddBuilding(user.storeId);
  if (!gate.allowed) {
    return {
      ok: false,
      error: gate.reason ?? "غير مسموح بإضافة عمارة جديدة",
    };
  }

  const deliveryFeeRaw =
    input.deliveryFee == null || input.deliveryFee === ""
      ? null
      : Number(input.deliveryFee);
  const deliveryFee =
    deliveryFeeRaw !== null && Number.isFinite(deliveryFeeRaw) && deliveryFeeRaw >= 0
      ? deliveryFeeRaw
      : null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let created: { id: string; code: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateBuildingCode();
    try {
      const building = await db.building.create({
        data: {
          name,
          code,
          storeId: user.storeId,
          street: input.street?.trim() || null,
          buildingNumber: input.buildingNumber?.trim() || null,
          compoundName: input.compoundName?.trim() || null,
          deliveryFee,
        },
      });
      created = { id: building.id, code: building.code };
      break;
    } catch {
      // unique-code collision — try again
    }
  }
  if (!created) return { ok: false, error: "تعذر توليد كود فريد للعمارة، جرب تاني" };

  const url = `${baseUrl}/b/${created.code}`;
  try {
    await QRCode.toDataURL(url);
  } catch {
    return { ok: false, error: "تعذر توليد QR" };
  }

  await db.qRCode.create({
    data: {
      storeId: user.storeId,
      buildingId: created.id,
      code: created.code,
      url,
    },
  });

  await auditLog({
    userId: user.id,
    action: "BUILDING_CREATED",
    entity: "Building",
    entityId: created.id,
    metadata: { code: created.code, name, storeId: user.storeId },
  });

  revalidatePath("/store/buildings");
  revalidatePath("/store/qrcodes");
  return { ok: true, data: created };
}

export async function updateBuilding(
  id: string,
  input: BuildingInput
): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف العمارة مفقود" };

  const building = await db.building.findFirst({
    where: { id, storeId: user.storeId },
  });
  if (!building) return { ok: false, error: "العمارة غير موجودة" };

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 2) return { ok: false, error: "اسم العمارة مطلوب" };

  const deliveryFeeRaw =
    input.deliveryFee == null || input.deliveryFee === ""
      ? null
      : Number(input.deliveryFee);
  const deliveryFee =
    deliveryFeeRaw !== null && Number.isFinite(deliveryFeeRaw) && deliveryFeeRaw >= 0
      ? deliveryFeeRaw
      : null;

  await db.building.update({
    where: { id },
    data: {
      name,
      street: input.street?.trim() || null,
      buildingNumber: input.buildingNumber?.trim() || null,
      compoundName: input.compoundName?.trim() || null,
      deliveryFee,
    },
  });

  await auditLog({
    userId: user.id,
    action: "BUILDING_UPDATED",
    entity: "Building",
    entityId: id,
    metadata: { name, storeId: user.storeId },
  });

  revalidatePath("/store/buildings");
  return { ok: true };
}

export async function toggleBuildingActive(id: string): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف العمارة مفقود" };

  const building = await db.building.findFirst({
    where: { id, storeId: user.storeId },
  });
  if (!building) return { ok: false, error: "العمارة غير موجودة" };

  await db.building.update({
    where: { id },
    data: { isActive: !building.isActive },
  });

  await auditLog({
    userId: user.id,
    action: building.isActive ? "BUILDING_DEACTIVATED" : "BUILDING_ACTIVATED",
    entity: "Building",
    entityId: id,
    metadata: { storeId: user.storeId },
  });

  revalidatePath("/store/buildings");
  revalidatePath("/store/qrcodes");
  return { ok: true };
}

export async function deleteBuilding(id: string): Promise<ActionResult> {
  const user = await requireStore();
  if (!id) return { ok: false, error: "معرف العمارة مفقود" };

  const building = await db.building.findFirst({
    where: { id, storeId: user.storeId },
    include: { _count: { select: { orders: true } } },
  });
  if (!building) return { ok: false, error: "العمارة غير موجودة" };

  if (building._count.orders > 0) {
    return {
      ok: false,
      error: "لا يمكن حذف عمارة عليها طلبات — عطّلها بدل الحذف",
    };
  }

  await db.building.delete({ where: { id } });

  await auditLog({
    userId: user.id,
    action: "BUILDING_DELETED",
    entity: "Building",
    entityId: id,
    metadata: { storeId: user.storeId, name: building.name },
  });

  revalidatePath("/store/buildings");
  revalidatePath("/store/qrcodes");
  return { ok: true };
}
