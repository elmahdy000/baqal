"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { checkoutSchema, customRequestSchema, type CheckoutInput } from "@/lib/validators";
import { generateOrderNumber, formatEGP } from "@/lib/utils";
import { emitTo } from "@/lib/emit";
import { EVENTS, rooms } from "@/lib/realtime";
import { sendPushToStore, sendPushToCustomerPhone } from "@/lib/push";
import { rateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { isStoreOpenNow } from "@/lib/hours";
import { signOrderToken } from "@/lib/order-token";

export type PlaceOrderResult =
  | { ok: true; orderId: string; orderNumber: string; token: string }
  | { ok: false; error: string };

export async function placeOrder(input: CheckoutInput): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }
  const data = parsed.data;

  const rl = rateLimit(`place-order:${data.customerPhone}`, 10, 60_000);
  if (!rl.allowed) {
    return { ok: false, error: "طلبات كتيرة، حاول تاني بعد شوية" };
  }

  const store = await db.store.findUnique({ where: { slug: data.storeSlug } });
  if (!store) return { ok: false, error: "البقالة مش موجودة" };
  if (store.status !== "ACTIVE") return { ok: false, error: "البقالة مش نشطة" };
  if (!store.isOpen || !isStoreOpenNow(store)) return { ok: false, error: "البقالة مقفولة دلوقتي" };

  let building = null;
  if (data.buildingCode) {
    building = await db.building.findUnique({ where: { code: data.buildingCode } });
    if (!building || building.storeId !== store.id) {
      return { ok: false, error: "العمارة مش تابعة للبقالة" };
    }
  }

  const productIds = data.items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, storeId: store.id },
  });

  if (products.length !== productIds.length) {
    return { ok: false, error: "بعض المنتجات مش موجودة" };
  }

  const badItems: string[] = [];
  for (const item of data.items) {
    const p = products.find((x) => x.id === item.productId);
    if (!p) {
      badItems.push(item.productId);
      continue;
    }
    if (!p.isAvailable) badItems.push(p.nameAr ?? p.name);
    else if (p.stockQuantity < item.quantity) badItems.push(p.nameAr ?? p.name);
  }
  if (badItems.length) {
    return { ok: false, error: `المنتجات دي مش متوفرة: ${badItems.join("، ")}` };
  }

  // Compute totals
  let subtotal = 0;
  const orderItemsData = data.items.map((item) => {
    const p = products.find((x) => x.id === item.productId)!;
    const unitPrice = p.discountPrice ? Number(p.discountPrice) : Number(p.price);
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;
    return {
      productId: p.id,
      productNameSnapshot: p.nameAr ?? p.name,
      quantity: item.quantity,
      unitPrice: unitPrice.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      notes: item.notes || null,
    };
  });

  const deliveryFee =
    building?.deliveryFee != null ? Number(building.deliveryFee) : Number(store.deliveryFee);
  const total = subtotal + deliveryFee;

  const minOrder = Number(store.minOrderAmount);
  if (minOrder > 0 && subtotal < minOrder) {
    return {
      ok: false,
      error: `أقل طلب ${minOrder.toFixed(2)} ج.م`,
    };
  }

  // Upsert customer
  const customer = await db.customer.upsert({
    where: { storeId_phone: { storeId: store.id, phone: data.customerPhone } },
    create: {
      name: data.customerName,
      phone: data.customerPhone,
      storeId: store.id,
    },
    update: { name: data.customerName },
  });

  const buildingName = building?.name ?? undefined;

  // Create address
  const address = await db.address.create({
    data: {
      customerId: customer.id,
      buildingId: building?.id,
      buildingName,
      floor: data.floor,
      apartment: data.apartment,
      deliveryNotes: data.deliveryNotes,
      isDefault: true,
    },
  });

  const orderNumber = generateOrderNumber();

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        storeId: store.id,
        customerId: customer.id,
        buildingId: building?.id,
        addressId: address.id,
        status: "PENDING",
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        discount: "0.00",
        total: total.toFixed(2),
        paymentMethod: data.paymentMethod,
        paymentStatus: "UNPAID",
        notes: data.deliveryNotes,
        items: {
          create: orderItemsData,
        },
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: created.id,
        status: "PENDING",
        note: "تم إرسال الطلب",
      },
    });

    return created;
  });

  // Notification for store
  const notification = await db.notification.create({
    data: {
      storeId: store.id,
      type: "ORDER_NEW",
      title: "طلب جديد وصل",
      body: buildingName
        ? `عندك طلب جديد من عمارة ${buildingName}`
        : `عندك طلب جديد من ${data.customerName}`,
      data: { orderId: order.id, orderNumber: order.orderNumber, url: `/store/orders/${order.id}` },
    },
  });

  emitTo(rooms.store(store.id), EVENTS.ORDER_NEW, {
    orderId: order.id,
    orderNumber: order.orderNumber,
    storeId: store.id,
    customerName: data.customerName,
    total,
    status: "PENDING",
  });

  emitTo(rooms.store(store.id), EVENTS.NOTIFICATION_NEW, {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    storeId: store.id,
  });

  void sendPushToStore(store.id, {
    title: "طلب جديد وصل",
    body: `طلب من ${data.customerName} — ${formatEGP(total)}`,
    url: `/store/orders/${order.id}`,
    tag: "order-new",
  });

  await auditLog({
    action: "ORDER_PLACED",
    entity: "Order",
    entityId: order.id,
    metadata: {
      orderNumber: order.orderNumber,
      storeId: store.id,
      customerId: customer.id,
      total,
    },
  });

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    token: signOrderToken(order.id),
  };
}

export type CancelResult = { ok: true } | { ok: false; error: string };

export async function cancelOrder(orderId: string): Promise<CancelResult> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "الطلب مش موجود" };
  if (order.status !== "PENDING") {
    return { ok: false, error: "الطلب مش قابل للإلغاء" };
  }

  await db.$transaction([
    db.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    }),
    db.orderStatusHistory.create({
      data: {
        orderId,
        status: "CANCELLED",
        note: "تم إلغاء الطلب من العميل",
      },
    }),
  ]);

  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    storeId: order.storeId,
    status: "CANCELLED",
  };
  emitTo(rooms.store(order.storeId), EVENTS.ORDER_CANCELLED, payload);
  emitTo(rooms.order(order.id), EVENTS.ORDER_CANCELLED, payload);

  return { ok: true };
}

// ---------- Custom Requests ----------

export type CustomRequestResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createCustomRequest(input: unknown): Promise<CustomRequestResult> {
  const parsed = customRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }
  const data = parsed.data;

  const store = await db.store.findUnique({ where: { slug: data.storeSlug } });
  if (!store) return { ok: false, error: "البقالة مش موجودة" };
  if (store.status !== "ACTIVE") return { ok: false, error: "البقالة مش نشطة" };

  const customer = await db.customer.upsert({
    where: { storeId_phone: { storeId: store.id, phone: data.customerPhone } },
    create: {
      name: data.customerName,
      phone: data.customerPhone,
      storeId: store.id,
    },
    update: { name: data.customerName },
  });

  const req = await db.customRequest.create({
    data: {
      storeId: store.id,
      customerId: customer.id,
      text: data.text,
      status: "PENDING",
    },
  });

  const notification = await db.notification.create({
    data: {
      storeId: store.id,
      type: "SYSTEM",
      title: "طلب مخصص جديد",
      body: `${data.customerName}: ${data.text.slice(0, 80)}`,
      data: { customRequestId: req.id, url: `/store/custom-requests` },
    },
  });

  emitTo(rooms.store(store.id), EVENTS.NOTIFICATION_NEW, {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    storeId: store.id,
  });

  revalidatePath("/store/custom-requests");
  return { ok: true, id: req.id };
}

export type CustomerLoginResult =
  | { ok: true; isNew: false; customer: { name: string; phone: string; storeSlug: string }; orders: { id: string; token: string }[]; addresses: { buildingName?: string | null; floor?: string | null; apartment?: string | null; deliveryNotes?: string | null }[] }
  | { ok: true; isNew: true; phone: string }
  | { ok: false; error: string };

export async function customerLogin(phone: string, name?: string, storeSlug?: string): Promise<CustomerLoginResult> {
  const cleanPhone = phone.trim();
  if (!cleanPhone || cleanPhone.length < 9) {
    return { ok: false, error: "رقم الموبايل غير صحيح. يجب أن يتكون من 9 أرقام على الأقل." };
  }

  let store = null;
  if (storeSlug) {
    store = await db.store.findUnique({ where: { slug: storeSlug } });
  }

  // Find customer by phone.
  // Customers are store-scoped, so let's check if they exist in the target store or any active store.
  let customer = await db.customer.findFirst({
    where: store ? { phone: cleanPhone, storeId: store.id } : { phone: cleanPhone },
    include: {
      orders: {
        select: { id: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      store: {
        select: { slug: true },
      },
    },
  });

  if (!customer) {
    // If not found and name not provided, signal that we need a name (new profile registration)
    if (!name) {
      return { ok: true, isNew: true, phone: cleanPhone };
    }

    // Find store to bind new customer to
    if (!store) {
      store = await db.store.findFirst({ where: { status: "ACTIVE" } });
      if (!store) {
        return { ok: false, error: "لا يوجد بقالة نشطة حالياً للتسجيل فيها." };
      }
    }

    customer = await db.customer.create({
      data: {
        phone: cleanPhone,
        name: name.trim(),
        storeId: store.id,
      },
      include: {
        orders: {
          select: { id: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        store: {
          select: { slug: true },
        },
      },
    });
  }

  // Generate tokens for customer orders so they can access their order detail pages securely
  const ordersWithTokens = customer.orders.map((o) => ({
    id: o.id,
    token: signOrderToken(o.id),
  }));

  // Fetch customer default addresses
  const addresses = await db.address.findMany({
    where: { customerId: customer.id },
    orderBy: { isDefault: "desc" },
    select: {
      buildingName: true,
      floor: true,
      apartment: true,
      deliveryNotes: true,
    },
  });

  return {
    ok: true,
    isNew: false,
    customer: {
      name: customer.name,
      phone: customer.phone,
      storeSlug: customer.store.slug,
    },
    orders: ordersWithTokens,
    addresses,
  };
}

