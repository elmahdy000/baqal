import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SearchX } from "lucide-react";

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
          <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <SearchX className="h-10 w-10 text-slate-400" />
          </div>
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
