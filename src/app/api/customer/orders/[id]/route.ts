import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { verifyOrderToken } from "@/lib/order-token";
import { auth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(`customer-order:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "طلبات كتيرة، حاول تاني بعد شوية" },
      { status: 429, headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : {} }
    );
  }

  // Ownership: either the caller holds a signed token issued at placeOrder,
  // OR the caller has an authenticated staff/admin session scoped to the store.
  const url = new URL(req.url);
  const token =
    url.searchParams.get("t") ??
    req.headers.get("x-order-token") ??
    "";

  let authorized = false;
  let orderRow: { storeId: string } | null = null;

  if (token && verifyOrderToken(id, token)) {
    authorized = true;
  } else {
    orderRow = await db.order.findUnique({
      where: { id },
      select: { storeId: true },
    });
    if (!orderRow) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const session = await auth();
    const user = session?.user;
    if (user) {
      if (user.role === "SUPER_ADMIN") authorized = true;
      else if (
        (user.role === "STORE_OWNER" || user.role === "STORE_STAFF") &&
        user.storeId === orderRow.storeId
      ) {
        authorized = true;
      } else if (user.role === "DELIVERY") {
        const assigned = await db.order.findFirst({
          where: { id, driverId: user.id },
          select: { id: true },
        });
        if (assigned) authorized = true;
      }
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              nameAr: true,
              name: true,
              imageUrl: true,
              unit: true,
              stockQuantity: true,
              isAvailable: true,
            },
          },
        },
      },
      store: {
        select: { id: true, slug: true, name: true, nameAr: true, phone: true },
      },
      building: {
        select: { id: true, name: true, code: true },
      },
      address: true,
      customer: { select: { id: true, name: true, phone: true } },
      history: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...order,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discount: Number(order.discount),
    total: Number(order.total),
    items: order.items.map((it) => ({
      ...it,
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
    })),
  });
}
