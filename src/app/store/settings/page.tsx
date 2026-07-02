import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StoreSettingsForm } from "@/components/store/settings-form";

export default async function StoreSettingsPage() {
  const user = await requireStore();
  const store = await db.store.findUnique({ where: { id: user.storeId } });
  if (!store) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-sm text-gray-500">إعدادات البقالة</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>بيانات البقالة</CardTitle>
        </CardHeader>
        <CardContent>
          <StoreSettingsForm
            initial={{
              name: store.name,
              nameAr: store.nameAr ?? "",
              phone: store.phone ?? "",
              deliveryFee: Number(store.deliveryFee),
              minOrderAmount: Number(store.minOrderAmount),
              openingHours: store.openingHours ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
