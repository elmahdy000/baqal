import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Building2 } from "lucide-react";
import { NewBuildingForm } from "./_components/new-building-form";

export default async function AdminBuildingsPage() {
  const [buildings, stores] = await Promise.all([
    db.building.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { name: true, nameAr: true } },
        area: { select: { name: true, nameAr: true } },
      },
    }),
    db.store.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, nameAr: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العمارات</h1>
          <p className="text-sm text-gray-500">قائمة العمارات على المنصة</p>
        </div>
      </div>

      <NewBuildingForm stores={stores} />

      <Card>
        <CardHeader>
          <CardTitle>الكل ({buildings.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الاسم</th>
                  <th className="px-4 py-3 font-medium">الكود</th>
                  <th className="px-4 py-3 font-medium">البقالة</th>
                  <th className="px-4 py-3 font-medium">المنطقة</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {buildings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-0 py-4">
                      <EmptyState
                        icon={<Building2 className="h-6 w-6" />}
                        title="لسه مفيش عمارات"
                        description="أضف أول عمارة من الفورم فوق."
                      />
                    </td>
                  </tr>
                ) : (
                  buildings.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-700">{b.code}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {b.store.nameAr ?? b.store.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {b.area ? b.area.nameAr ?? b.area.name : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={b.isActive ? "green" : "red"}>
                          {b.isActive ? "نشطة" : "موقوفة"}
                        </Badge>
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
