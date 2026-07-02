import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AreasClient } from "./_client";

export const dynamic = "force-dynamic";

export default async function AdminAreasPage() {
  const areas = await db.area.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { buildings: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">المناطق</h1>
        <p className="text-sm text-gray-500">إدارة المناطق والمدن</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الكل ({areas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <AreasClient
            areas={areas.map((a) => ({
              id: a.id,
              name: a.name,
              nameAr: a.nameAr ?? "",
              city: a.city ?? "",
              buildingsCount: a._count.buildings,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
