import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { CategoryPageBody } from "./_components/category-page-body";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await requireStore();

  const categories = await db.category.findMany({
    where: { storeId: user.storeId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { products: true } },
    },
  });

  const rows = categories.map((c) => ({
    id: c.id,
    nameAr: c.nameAr,
    slug: c.slug,
    icon: c.icon ?? null,
    order: c.order,
    productCount: c._count.products,
  }));

  return <CategoryPageBody categories={rows} />;
}
