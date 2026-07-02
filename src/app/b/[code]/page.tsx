import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function QRLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const qr = await db.qRCode.findUnique({
    where: { code },
    include: { store: true, building: true },
  });

  if (!qr || !qr.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">الكود مش موجود</h1>
          <p className="text-gray-600">
            الكود اللي مسحته مش صحيح أو تم إلغاؤه. اسأل البقال أو جرب مرة تانية.
          </p>
        </div>
      </div>
    );
  }

  // Fire-and-forget scan tracking
  db.qRCode
    .update({
      where: { id: qr.id },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
      },
    })
    .catch(() => {
      /* ignore */
    });

  redirect(`/s/${qr.store.slug}?bcode=${code}`);
}
