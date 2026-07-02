import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Download, Printer, QrCode } from "lucide-react";

export default async function AdminQRCodesPage() {
  const codes = await db.qRCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      building: { select: { name: true } },
      store: { select: { name: true, nameAr: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">أكواد QR</h1>
        <p className="text-sm text-gray-500">أكواد الدخول للعمارات</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الكل ({codes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الكود</th>
                  <th className="px-4 py-3 font-medium">العمارة</th>
                  <th className="px-4 py-3 font-medium">البقالة</th>
                  <th className="px-4 py-3 font-medium">عدد المسحات</th>
                  <th className="px-4 py-3 font-medium">آخر مسح</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-0 py-4">
                      <EmptyState
                        icon={<QrCode className="h-6 w-6" />}
                        title="لسه مفيش QR"
                        description="أنشئ عمارات عشان تظهر أكوادها هنا."
                      />
                    </td>
                  </tr>
                ) : (
                  codes.map((q) => (
                    <tr key={q.id}>
                      <td className="px-4 py-3 font-mono font-medium text-gray-900">
                        {q.code}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{q.building.name}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {q.store.nameAr ?? q.store.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{q.scanCount}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {q.lastScannedAt
                          ? q.lastScannedAt.toLocaleDateString("ar-EG")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={q.isActive ? "green" : "red"}>
                          {q.isActive ? "نشط" : "متوقف"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <a
                            href={`/api/admin/qr/${q.code}/download`}
                            className="inline-flex items-center gap-1 text-sm text-green-700 hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>تحميل QR</span>
                          </a>
                          <a
                            href={`/api/admin/qr/${q.code}/poster`}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1 text-sm text-gray-700 hover:underline"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>طباعة ملصق</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
