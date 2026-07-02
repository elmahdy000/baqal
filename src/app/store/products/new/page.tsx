import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/store/product-form";

export default async function NewProductPage() {
  const user = await requireStore();
  const categories = await db.category.findMany({
    where: { storeId: user.storeId },
    orderBy: { order: "asc" },
    select: { id: true, nameAr: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">منتج جديد</h1>
        <p className="text-sm text-gray-500">أضف منتج للبقالة</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>بيانات المنتج</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
