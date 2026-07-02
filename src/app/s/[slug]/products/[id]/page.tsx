import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatEGP } from "@/lib/utils";
import { productUnitLabel } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard, type ProductCardData } from "@/components/customer/product-card";
import { ProductDetailAdd } from "@/components/customer/product-detail-add";
import { FloatingCart } from "@/components/customer/floating-cart";
import { BottomNav } from "@/components/customer/bottom-nav";
import { ChevronRight, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ bcode?: string }>;
}) {
  const { slug, id } = await params;
  const { bcode } = await searchParams;

  const store = await db.store.findUnique({ where: { slug } });
  if (!store || store.status !== "ACTIVE") notFound();

  const product = await db.product.findFirst({
    where: { id, storeId: store.id },
    include: { category: true },
  });
  if (!product) notFound();

  const activePrice = product.discountPrice
    ? Number(product.discountPrice)
    : Number(product.price);
  const outOfStock = !product.isAvailable || product.stockQuantity <= 0;
  const isLowStock =
    !outOfStock && product.stockQuantity <= product.lowStockThreshold;

  const related = product.categoryId
    ? await db.product.findMany({
        where: {
          storeId: store.id,
          categoryId: product.categoryId,
          isAvailable: true,
          id: { not: product.id },
        },
        take: 6,
        orderBy: { createdAt: "desc" },
      })
    : [];

  const backHref = bcode ? `/s/${slug}?bcode=${bcode}` : `/s/${slug}`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="px-4 py-3 flex items-center gap-2">
          <Link
            href={backHref}
            aria-label="رجوع"
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="text-base font-bold text-gray-900 line-clamp-1">
            {product.nameAr ?? product.name}
          </h1>
        </div>
      </header>

      <main className="pb-24">
        <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.nameAr ?? product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-24 w-24 text-gray-300" />
          )}
          {product.discountPrice && (
            <span className="absolute top-3 right-3 rounded-full bg-orange-500 text-white text-xs px-3 py-1 font-medium">
              خصم
            </span>
          )}
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {product.nameAr ?? product.name}
            </h2>
            {product.category && (
              <Link
                href={`/s/${slug}?cat=${product.category.slug}${bcode ? `&bcode=${bcode}` : ""}`}
                className="mt-1 inline-block text-xs text-green-700 hover:underline"
              >
                {product.category.nameAr}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-green-700">
              {formatEGP(activePrice)}
            </span>
            {product.discountPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatEGP(Number(product.price))}
              </span>
            )}
            <span className="text-xs text-gray-500">
              / {productUnitLabel(product.unit)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {outOfStock ? (
              <Badge tone="red">غير متوفر</Badge>
            ) : isLowStock ? (
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                باقي {product.stockQuantity} بس
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                متوفر
              </Badge>
            )}
          </div>

          {product.description && (
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">الوصف</div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          )}

          <ProductDetailAdd
            product={{
              id: product.id,
              nameAr: product.nameAr ?? product.name,
              price: activePrice,
              imageUrl: product.imageUrl,
              stockQuantity: product.stockQuantity,
              isAvailable: product.isAvailable,
              unit: product.unit,
            }}
            storeSlug={slug}
            buildingCode={bcode}
          />

          {related.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                منتجات مشابهة
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {related.map((p) => {
                  const data: ProductCardData = {
                    id: p.id,
                    nameAr: p.nameAr ?? p.name,
                    price: Number(p.price),
                    discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
                    imageUrl: p.imageUrl,
                    stockQuantity: p.stockQuantity,
                    isAvailable: p.isAvailable,
                    unit: p.unit,
                  };
                  return (
                    <ProductCard
                      key={p.id}
                      product={data}
                      storeSlug={slug}
                      buildingCode={bcode}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <FloatingCart storeSlug={slug} buildingCode={bcode} />
      <BottomNav />
    </div>
  );
}
