import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferForm, type OfferFormProduct } from "../../_components/offer-form";

export const dynamic = "force-dynamic";

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStore();
  const { id } = await params;

  const [offer, products] = await Promise.all([
    db.offer.findFirst({ where: { id, storeId: user.storeId } }),
    db.product.findMany({
      where: { storeId: user.storeId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, nameAr: true, price: true, imageUrl: true },
      take: 500,
    }),
  ]);

  if (!offer) notFound();

  const productList: OfferFormProduct[] = products.map((p) => ({
    id: p.id,
    nameAr: p.nameAr ?? p.name,
    price: Number(p.price),
    imageUrl: p.imageUrl,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تعديل العرض</h1>
        <p className="text-sm text-gray-500">{offer.title}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل العرض</CardTitle>
        </CardHeader>
        <CardContent>
          <OfferForm
            offerId={offer.id}
            products={productList}
            initial={{
              title: offer.title,
              description: offer.description,
              imageUrl: offer.imageUrl,
              discountPct: offer.discountPct,
              startsAt: offer.startsAt.toISOString(),
              endsAt: offer.endsAt ? offer.endsAt.toISOString() : null,
              isActive: offer.isActive,
              productIds: offer.productIds,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
