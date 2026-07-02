import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

type Body = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  storeSlug?: string;
  customerPhone?: string;
};

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(`push-subscribe:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "طلبات كتيرة، حاول تاني بعد شوية" },
      { status: 429, headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : {} }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const endpoint = body.endpoint;
  const p256dh = body.keys?.p256dh;
  const authKey = body.keys?.auth;

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent") ?? null;

  // Customer subscription (no session): needs storeSlug + phone
  if (body.storeSlug || body.customerPhone) {
    const slug = body.storeSlug?.trim();
    const phone = body.customerPhone?.trim();
    if (!slug || !phone || phone.length < 6) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }
    const store = await db.store.findUnique({ where: { slug } });
    if (!store) {
      return NextResponse.json({ error: "البقالة غير موجودة" }, { status: 404 });
    }
    await db.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh,
        auth: authKey,
        userAgent,
        customerPhone: phone,
        storeId: store.id,
      },
      update: {
        p256dh,
        auth: authKey,
        userAgent,
        customerPhone: phone,
        storeId: store.id,
        userId: null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  // Staff/admin subscription (needs session)
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  await db.pushSubscription.upsert({
    where: { endpoint },
    create: {
      endpoint,
      p256dh,
      auth: authKey,
      userAgent,
      userId: session.user.id,
      storeId: session.user.storeId ?? null,
    },
    update: {
      p256dh,
      auth: authKey,
      userAgent,
      userId: session.user.id,
      storeId: session.user.storeId ?? null,
      customerPhone: null,
    },
  });

  return NextResponse.json({ ok: true });
}
