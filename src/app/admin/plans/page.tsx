import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const TIER_LABEL: Record<string, string> = {
  BASIC: "أساسية",
  PLUS: "بلس",
  PRO: "برو",
  ENTERPRISE: "مؤسسات",
};

export default async function AdminPlansPage() {
  const plans = await db.plan.findMany({
    orderBy: { priceMonthly: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الخطط</h1>
        <p className="text-sm text-gray-500">قائمة خطط الاشتراك</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الكل ({plans.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الخطة</th>
                  <th className="px-4 py-3 font-medium">شهري</th>
                  <th className="px-4 py-3 font-medium">سنوي</th>
                  <th className="px-4 py-3 font-medium">عمارات</th>
                  <th className="px-4 py-3 font-medium">منتجات</th>
                  <th className="px-4 py-3 font-medium">مستخدمين</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      لا توجد خطط
                    </td>
                  </tr>
                ) : (
                  plans.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.nameAr}</div>
                        <div className="text-xs text-gray-500">
                          {TIER_LABEL[p.tier] ?? p.tier}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {Number(p.priceMonthly).toFixed(2)} ج.م
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {Number(p.priceYearly).toFixed(2)} ج.م
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {p.maxBuildings >= 99999 ? "غير محدود" : p.maxBuildings}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {p.maxProducts >= 99999 ? "غير محدود" : p.maxProducts}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {p.maxStoreUsers >= 99999 ? "غير محدود" : p.maxStoreUsers}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={p.isActive ? "green" : "red"}>
                          {p.isActive ? "مفعّلة" : "متوقفة"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/plans/${p.id}/edit`}
                          className="text-sm text-green-700 hover:underline"
                        >
                          تعديل
                        </Link>
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
