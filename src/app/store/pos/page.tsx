import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { POSTerminal } from "@/components/store/pos-terminal";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  const user = await requireStore();

  const [products, recentSales, todayAgg] = await Promise.all([
    db.product.findMany({
      where: {
        storeId: user.storeId,
        isAvailable: true,
        stockQuantity: { gt: 0 },
      },
      include: { category: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    db.walkInSale.findMany({
      where: { storeId: user.storeId },
      orderBy: { createdAt: "desc" },
      take: 1,
      select: { saleNumber: true, total: true, createdAt: true },
    }),
    (async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const [countRes, sumRes] = await Promise.all([
        db.walkInSale.count({
          where: { storeId: user.storeId, createdAt: { gte: start } },
        }),
        db.walkInSale.aggregate({
          where: { storeId: user.storeId, createdAt: { gte: start } },
          _sum: { total: true },
        }),
      ]);
      return { count: countRes, total: Number(sumRes._sum.total ?? 0) };
    })(),
  ]);

  const posProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    price: Number(p.price),
    discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
    stockQuantity: p.stockQuantity,
    imageUrl: p.imageUrl,
    categoryNameAr: p.category?.nameAr ?? null,
    categoryId: p.categoryId,
  }));

  const categories = Array.from(
    new Map(
      products
        .filter((p) => p.category)
        .map((p) => [p.category!.id, { id: p.category!.id, name: p.category!.nameAr ?? p.category!.name }])
    ).values()
  );

  const lastSale = recentSales[0]
    ? {
        saleNumber: recentSales[0].saleNumber,
        total: Number(recentSales[0].total),
      }
    : null;

  return (
    <POSTerminal
      products={posProducts}
      categories={categories}
      todaySalesCount={todayAgg.count}
      todaySalesTotal={todayAgg.total}
      lastSale={lastSale}
    />
  );
}
