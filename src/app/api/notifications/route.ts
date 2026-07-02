import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

function scopeFor(user: {
  id: string;
  storeId: string | null;
}): Prisma.NotificationWhereInput {
  if (user.storeId) return { storeId: user.storeId };
  return { userId: user.id };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const where = scopeFor(session.user);
  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.notification.count({ where: { ...where, isRead: false } }),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const url = new URL(req.url);
  if (url.searchParams.get("markAllRead") === "1") {
    const where = scopeFor(session.user);
    await db.notification.updateMany({
      where: { ...where, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "لا شيء" }, { status: 400 });
}
