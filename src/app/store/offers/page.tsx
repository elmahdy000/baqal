import Link from "next/link";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function OffersPage() {
  const user = await requireStore();

  const offers = await db.offer.findMany({
    where: { storeId: user.storeId },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العروض</h1>
          <p className="text-sm text-gray-500">إدارة عروض البقالة</p>
        </div>
        <Button asChild>
          <Link href="/store/offers/new">عرض جديد</Link>
        </Button>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-gray-500">
            لسه مفيش عروض
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="text-right">
                  <th className="p-3 font-medium">العنوان</th>
                  <th className="p-3 font-medium">الخصم</th>
                  <th className="p-3 font-medium">يبدأ</th>
                  <th className="p-3 font-medium">ينتهي</th>
                  <th className="p-3 font-medium">عدد المنتجات</th>
                  <th className="p-3 font-medium">الحالة</th>
                  <th className="p-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => {
                  const live =
                    o.isActive &&
                    new Date(o.startsAt) <= now &&
                    (!o.endsAt || new Date(o.endsAt) >= now);
                  return (
                    <tr key={o.id} className="border-t border-gray-100">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">
                          {o.title}
                        </div>
                        {o.description && (
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {o.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-gray-900">
                        {o.discountPct != null ? `${o.discountPct}%` : "—"}
                      </td>
                      <td className="p-3 text-gray-700">{formatDate(o.startsAt)}</td>
                      <td className="p-3 text-gray-700">{formatDate(o.endsAt)}</td>
                      <td className="p-3 text-gray-700">
                        {o.productIds.length}
                      </td>
                      <td className="p-3">
                        {live ? (
                          <Badge tone="green">شغال</Badge>
                        ) : o.isActive ? (
                          <Badge tone="yellow">مجدول/منتهي</Badge>
                        ) : (
                          <Badge tone="default">متوقف</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/store/offers/${o.id}/edit`}>تعديل</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
