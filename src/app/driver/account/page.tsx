import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DriverAccountPage() {
  const user = await requireRole("DELIVERY");
  const store = user.storeId
    ? await db.store.findUnique({ where: { id: user.storeId } })
    : null;

  const deliveredCount = await db.order.count({
    where: { driverId: user.id, status: "DELIVERED" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">حسابي</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>البيانات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-gray-700">
          <Row label="الاسم" value={user.name ?? "—"} />
          <Row label="البريد" value={user.email ?? "—"} />
          <Row label="البقالة" value={store ? store.nameAr ?? store.name : "—"} />
          <Row label="عدد التوصيلات" value={String(deliveredCount)} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-1.5 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
