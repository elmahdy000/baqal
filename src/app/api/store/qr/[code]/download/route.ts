import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const user = await requireStore();
  const { code } = await params;

  const qr = await db.qRCode.findUnique({
    where: { code },
    include: { building: true },
  });
  if (!qr || qr.storeId !== user.storeId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const png = await QRCode.toBuffer(qr.url, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
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
