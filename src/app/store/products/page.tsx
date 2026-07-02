import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEGP, cn } from "@/lib/utils";
import { ProductRowActions } from "@/components/store/product-row-actions";
import { EmptyState } from "@/components/ui/empty";
import { Package } from "lucide-react";

type StockFilter = "all" | "available" | "low" | "out";

const STOCK_LABEL: Record<StockFilter, string> = {
  all: "الكل",
  available: "متاح",
  low: "منخفض",
  out: "نفد",
};

function parseStock(raw?: string): StockFilter {
  if (raw === "available" || raw === "low" || raw === "out") return raw;
  return "all";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; stock?: string }>;
}) {
  const user = await requireStore();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const categoryId = sp.category ?? "";
  const stock = parseStock(sp.stock);

  const where: Prisma.ProductWhereInput = { storeId: user.storeId };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { nameAr: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const [categories, allProducts] = await Promise.all([
    db.category.findMany({
      where: { storeId: user.storeId },
      orderBy: { order: "asc" },
    }),
    db.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  // Post-filter stock since low needs to compare two columns
  const products = allProducts.filter((p) => {
    if (stock === "available") return p.isAvailable && p.stockQuantity > 0;
    if (stock === "out") return p.stockQuantity === 0;
    if (stock === "low")
      return p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold;
    return true;
  });

  const stockFilters: StockFilter[] = ["all", "available", "low", "out"];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المنتجات</h1>
          <p className="text-sm text-gray-500">إدارة منتجات البقالة</p>
        </div>
        <Button asChild>
          <Link href="/store/products/new">منتج جديد</Link>
        </Button>
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="بحث بالاسم..."
          className="h-10 min-w-[220px] flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm"
        />
        <select
          name="category"
          defaultValue={categoryId}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
        >
          <option value="">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameAr}
            </option>
          ))}
        </select>
        <select
          name="stock"
          defaultValue={stock}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
        >
          {stockFilters.map((s) => (
            <option key={s} value={s}>
              المخزون: {STOCK_LABEL[s]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          بحث
        </Button>
      </form>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="لسه مفيش منتجات"
          description="ابدأ بإضافة أول منتج."
          action={
            <Button asChild>
              <Link href="/store/products/new">أضف منتج</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="text-right">
                  <th className="p-3 font-medium">المنتج</th>
                  <th className="p-3 font-medium">التصنيف</th>
                  <th className="p-3 font-medium">السعر</th>
                  <th className="p-3 font-medium">المخزون</th>
                  <th className="p-3 font-medium">الحالة</th>
                  <th className="p-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isOut = p.stockQuantity === 0;
                  const isLow =
                    p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold;
                  return (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {p.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.imageUrl}
                                alt={p.nameAr ?? p.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {p.nameAr ?? p.name}
                            </div>
                            <div className="text-xs text-gray-500">{p.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-700">
                        {p.category?.nameAr ?? "—"}
                      </td>
                      <td className="p-3 text-gray-900">
                        <div>{formatEGP(Number(p.price))}</div>
                        {p.discountPrice && (
                          <div className="text-xs text-green-700">
                            {formatEGP(Number(p.discountPrice))}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "font-semibold",
                            isOut
                              ? "text-red-700"
                              : isLow
                                ? "text-orange-700"
                                : "text-gray-900"
                          )}
                        >
                          {p.stockQuantity}
                        </span>
                        {isOut && (
                          <Badge tone="red" className="ms-2">
                            نفد
                          </Badge>
                        )}
                        {isLow && (
                          <Badge tone="orange" className="ms-2">
                            منخفض
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge tone={p.isAvailable ? "green" : "default"}>
                          {p.isAvailable ? "متاح" : "مخفي"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <ProductRowActions
                          productId={p.id}
                          isAvailable={p.isAvailable}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
