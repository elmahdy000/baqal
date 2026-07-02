import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const n = await db.notification.findUnique({ where: { id } });
  if (!n) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const owns =
    (session.user.storeId && n.storeId === session.user.storeId) ||
    n.userId === session.user.id;

  if (!owns) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  await db.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
