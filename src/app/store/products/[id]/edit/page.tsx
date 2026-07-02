import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/store/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStore();
  const { id } = await params;

  const [product, categories] = await Promise.all([
    db.product.findFirst({ where: { id, storeId: user.storeId } }),
    db.category.findMany({
      where: { storeId: user.storeId },
      orderBy: { order: "asc" },
      select: { id: true, nameAr: true },
    }),
  ]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تعديل المنتج</h1>
        <p className="text-sm text-gray-500">{product.nameAr ?? product.name}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>بيانات المنتج</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            productId={product.id}
            categories={categories}
            initial={{
              name: product.name,
              nameAr: product.nameAr ?? "",
              description: product.description ?? "",
              categoryId: product.categoryId ?? undefined,
              price: Number(product.price),
              discountPrice: product.discountPrice
                ? Number(product.discountPrice)
                : undefined,
              stockQuantity: product.stockQuantity,
              unit: product.unit,
              imageUrl: product.imageUrl ?? undefined,
              isAvailable: product.isAvailable,
              lowStockThreshold: product.lowStockThreshold,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
