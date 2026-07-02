import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const store = await db.store.findUnique({
    where: { slug },
  });
  if (!store || store.status !== "ACTIVE") {
    return new NextResponse("Store not found or suspended", { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/s/${slug}`;

  const png = await QRCode.toBuffer(url, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-store-${slug}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
