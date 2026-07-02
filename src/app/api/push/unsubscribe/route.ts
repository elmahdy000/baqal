import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  let body: { endpoint?: string };
  try {
    body = (await req.json()) as { endpoint?: string };
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  await db.pushSubscription.deleteMany({
    where: { endpoint: body.endpoint, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
