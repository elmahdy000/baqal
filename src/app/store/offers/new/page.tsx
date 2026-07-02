import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferForm, type OfferFormProduct } from "../_components/offer-form";

export const dynamic = "force-dynamic";

export default async function NewOfferPage() {
  const user = await requireStore();
  const products = await db.product.findMany({
    where: { storeId: user.storeId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, nameAr: true, price: true, imageUrl: true },
    take: 500,
  });

  const productList: OfferFormProduct[] = products.map((p) => ({
    id: p.id,
    nameAr: p.nameAr ?? p.name,
    price: Number(p.price),
    imageUrl: p.imageUrl,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">عرض جديد</h1>
        <p className="text-sm text-gray-500">أضف عرض لجذب العملاء</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل العرض</CardTitle>
        </CardHeader>
        <CardContent>
          <OfferForm products={productList} />
        </CardContent>
      </Card>
    </div>
  );
}
