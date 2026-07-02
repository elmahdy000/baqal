import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { code } = await params;
  const qr = await db.qRCode.findUnique({
    where: { code },
    include: {
      building: { select: { name: true } },
      store: { select: { name: true, nameAr: true } },
    },
  });
  if (!qr) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const dataUrl = await QRCode.toDataURL(qr.url, {
    width: 900,
    margin: 2,
    color: { dark: "#111827", light: "#FFFFFF" },
  });

  const storeName = escapeHtml(qr.store.nameAr ?? qr.store.name);
  const buildingName = escapeHtml(qr.building.name);
  const codeText = escapeHtml(qr.code);

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ملصق ${codeText}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif;
    background: #F8FAFC;
    color: #111827;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .poster {
    background: white;
    width: 420px;
    max-width: 100%;
    border: 2px solid #16A34A;
    border-radius: 24px;
    padding: 32px 24px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  }
  .brand {
    color: #16A34A;
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 6px;
  }
  .store {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 4px;
  }
  .building {
    font-size: 16px;
    color: #6B7280;
    margin-bottom: 20px;
  }
  .qr-wrap {
    background: white;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid #E5E7EB;
    display: inline-block;
    margin-bottom: 20px;
  }
  .qr-wrap img { display: block; width: 280px; height: 280px; }
  .headline {
    font-size: 26px;
    font-weight: 800;
    color: #111827;
    margin-bottom: 8px;
  }
  .sub {
    font-size: 15px;
    color: #4B5563;
    line-height: 1.5;
    margin-bottom: 16px;
  }
  .code {
    font-family: 'Courier New', monospace;
    font-size: 20px;
    letter-spacing: 4px;
    background: #F3F4F6;
    color: #111827;
    padding: 8px 16px;
    border-radius: 8px;
    display: inline-block;
    font-weight: 700;
  }
  .print-btn {
    margin-top: 20px;
    background: #16A34A;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    font-family: inherit;
    font-weight: 600;
  }
  @media print {
    body { background: white; padding: 0; }
    .poster {
      box-shadow: none;
      border: 2px solid #16A34A;
      page-break-inside: avoid;
    }
    .print-btn { display: none; }
  }
</style>
</head>
<body>
  <div class="poster">
    <div class="brand">بقال</div>
    <div class="store">${storeName}</div>
    <div class="building">${buildingName}</div>
    <div class="qr-wrap">
      <img src="${dataUrl}" alt="QR ${codeText}" />
    </div>
    <div class="headline">امسح واطلب من بقال العمارة</div>
    <div class="sub">طلبات بيتك توصلك لحد باب الشقة</div>
    <div class="code">${codeText}</div>
    <button class="print-btn" onclick="window.print()">طباعة</button>
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
