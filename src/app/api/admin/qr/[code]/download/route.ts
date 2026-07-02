import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { code } = await params;
  const qr = await db.qRCode.findUnique({ where: { code } });
  if (!qr) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const png = await QRCode.toBuffer(qr.url, {
    width: 800,
    margin: 2,
    color: { dark: "#111827", light: "#FFFFFF" },
  });

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${code}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
