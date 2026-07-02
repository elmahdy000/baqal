import Link from "next/link";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function StoreQRCodesPage() {
  const user = await requireStore();
  const qrCodes = await db.qRCode.findMany({
    where: { storeId: user.storeId },
    include: { building: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">أكواد QR</h1>
        <p className="text-sm text-gray-500">أكواد العمارات الخاصة بالبقالة</p>
      </div>

      {qrCodes.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-gray-500">
            لا توجد أكواد QR
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="text-right">
                  <th className="p-3 font-medium">الكود</th>
                  <th className="p-3 font-medium">العمارة</th>
                  <th className="p-3 font-medium">عدد المسحات</th>
                  <th className="p-3 font-medium">آخر مسح</th>
                  <th className="p-3 font-medium">الحالة</th>
                  <th className="p-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {qrCodes.map((q) => (
                  <tr key={q.id} className="border-t border-gray-100">
                    <td className="p-3 font-mono text-xs text-gray-900">{q.code}</td>
                    <td className="p-3 text-gray-700">{q.building.name}</td>
                    <td className="p-3 text-gray-900">{q.scanCount}</td>
                    <td className="p-3 text-xs text-gray-500">
                      {q.lastScannedAt
                        ? format(q.lastScannedAt, "yyyy/MM/dd HH:mm", { locale: arEG })
                        : "—"}
                    </td>
                    <td className="p-3">
                      <Badge tone={q.isActive ? "green" : "default"}>
                        {q.isActive ? "نشط" : "متوقف"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/api/store/qr/${q.code}/download`}
                            target="_blank"
                          >
                            تحميل QR
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/api/store/qr/${q.code}/poster`}
                            target="_blank"
                          >
                            طباعة
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
