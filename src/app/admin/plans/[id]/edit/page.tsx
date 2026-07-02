import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlanEditForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = await db.plan.findUnique({ where: { id } });
  if (!plan) notFound();

  const featuresArr = Array.isArray(plan.features)
    ? (plan.features as unknown[]).filter((f): f is string => typeof f === "string")
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تعديل الخطة</h1>
        <p className="text-sm text-gray-500">{plan.nameAr}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>البيانات</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanEditForm
            id={plan.id}
            initial={{
              name: plan.name,
              nameAr: plan.nameAr,
              priceMonthly: Number(plan.priceMonthly),
              priceYearly: Number(plan.priceYearly),
              maxBuildings: plan.maxBuildings,
              maxProducts: plan.maxProducts,
              maxStoreUsers: plan.maxStoreUsers,
              features: featuresArr.join(", "),
              isActive: plan.isActive,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
