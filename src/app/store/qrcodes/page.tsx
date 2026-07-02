import Link from "next/link";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { QrCode, Store, Download, Printer } from "lucide-react";

export default async function StoreQRCodesPage() {
  const user = await requireStore();
  const store = await db.store.findUnique({
    where: { id: user.storeId },
    select: { slug: true, nameAr: true, name: true }
  });

  const qrCodes = await db.qRCode.findMany({
    where: { storeId: user.storeId },
    include: { building: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">أكواد QR والتوصيل</h1>
          <p className="text-sm text-gray-500">تحميل وإدارة أكواد QR المخصصة لمتجرك أو العمارات.</p>
        </div>
      </div>

      {store && (
        <Card className="border border-green-150 bg-gradient-to-br from-green-50/20 via-white to-white shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <Store className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-base">كود المتجر المباشر (QR Code)</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                    كود QR مخصص لصفحة متجرك الرئيسية <span className="font-semibold text-green-700">({store.nameAr ?? store.name})</span>. 
                    يمكن للعملاء مسح هذا الكود للدخول إلى متجرك مباشرة وتصفح كل المنتجات من أي مكان.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button asChild variant="outline" className="border-gray-200">
                  <Link href={`/api/store-qr/${store.slug}/download`} target="_blank">
                    <Download className="h-4 w-4 ml-1.5" />
                    تحميل QR
                  </Link>
                </Button>
                <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                  <Link href={`/api/store-qr/${store.slug}/poster`} target="_blank">
                    <Printer className="h-4 w-4 ml-1.5" />
                    طباعة الملصق
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="font-bold text-gray-900 text-md mb-2">أكواد QR الخاصة بالعمارات</h3>
        <p className="text-xs text-gray-500 mb-4">أكواد مخصصة لعمارات محددة لتحديد عنوان التوصيل تلقائياً للعميل عند مسح الكود.</p>
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
