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

  const dataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const storeName = store.nameAr ?? store.name;

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>ملصق متجر - ${storeName}</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif; background: #fff; color: #111; }
  .poster { max-width: 720px; margin: 0 auto; padding: 40px; text-align: center; }
  .store { font-size: 32px; font-weight: 950; color: #16a34a; }
  .subtitle { font-size: 18px; font-weight: 600; color: #374151; margin-top: 6px; }
  .qr { margin: 24px auto; padding: 20px; border: 2px dashed #16a34a; border-radius: 16px; display: inline-block; background: #f0fdf4; }
  .qr img { display: block; width: 360px; height: 360px; }
  .slug { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 18px; margin-top: 12px; color: #6b7280; }
  .instr { margin-top: 20px; font-size: 18px; font-weight: 700; line-height: 1.6; color: #1f2937; }
  .brand { margin-top: 30px; font-size: 14px; color: #9ca3af; font-weight: 500; }
  @media print {
    .noprint { display: none; }
    body { background: #fff; }
  }
  .btn { display: inline-block; background: #16a34a; color: #fff; padding: 10px 20px; border-radius: 8px; border: 0; font-weight: 650; cursor: pointer; margin-top: 20px; }
</style>
</head>
<body>
  <div class="poster">
    <div class="store">${storeName}</div>
    <div class="subtitle">اطلب الآن مباشرة من متجرنا</div>
    <div class="qr"><img src="${dataUrl}" alt="QR" /></div>
    <div class="slug">baqal.app/s/${slug}</div>
    <div class="instr">امسح الـ QR بكاميرا موبايلك وافتح المتجر لطلب البقالة والمستلزمات في ثوانٍ!</div>
    <div class="brand">بقال — Baqal</div>
    <button class="btn noprint" onclick="window.print()">طباعة الملصق</button>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
