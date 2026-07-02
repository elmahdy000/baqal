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
    include: { building: true, store: true },
  });
  if (!qr || qr.storeId !== user.storeId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const dataUrl = await QRCode.toDataURL(qr.url, {
    width: 512,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const storeName = qr.store.nameAr ?? qr.store.name;
  const buildingName = qr.building.name;

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>ملصق ${code}</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif; background: #fff; color: #111; }
  .poster { max-width: 720px; margin: 0 auto; padding: 40px; text-align: center; }
  .store { font-size: 28px; font-weight: 800; color: #16a34a; }
  .building { font-size: 22px; font-weight: 600; margin-top: 6px; }
  .qr { margin: 24px auto; padding: 20px; border: 2px dashed #16a34a; border-radius: 16px; display: inline-block; background: #f0fdf4; }
  .qr img { display: block; width: 360px; height: 360px; }
  .code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 20px; margin-top: 12px; letter-spacing: 2px; }
  .instr { margin-top: 20px; font-size: 16px; line-height: 1.6; color: #374151; }
  .brand { margin-top: 30px; font-size: 12px; color: #6b7280; }
  @media print {
    .noprint { display: none; }
    body { background: #fff; }
  }
  .btn { display: inline-block; background: #16a34a; color: #fff; padding: 10px 20px; border-radius: 8px; border: 0; font-weight: 600; cursor: pointer; margin-top: 20px; }
</style>
</head>
<body>
  <div class="poster">
    <div class="store">${storeName}</div>
    <div class="building">${buildingName}</div>
    <div class="qr"><img src="${dataUrl}" alt="QR" /></div>
    <div class="code">${code}</div>
    <div class="instr">اسحب الكود بكاميرا موبايلك واطلب من البقالة توصل لباب شقتك</div>
    <div class="brand">بقال — Baqal</div>
    <button class="btn noprint" onclick="window.print()">طباعة</button>
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
