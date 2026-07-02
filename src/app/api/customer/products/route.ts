import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids") ?? "";
  const storeSlug = searchParams.get("store") ?? "";

  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!storeSlug || ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const store = await db.store.findUnique({ where: { slug: storeSlug } });
  if (!store) return NextResponse.json({ products: [] });

  const products = await db.product.findMany({
    where: {
      id: { in: ids },
      storeId: store.id,
      isAvailable: true,
    },
    select: {
      id: true,
      name: true,
      nameAr: true,
      price: true,
      discountPrice: true,
      imageUrl: true,
      stockQuantity: true,
      isAvailable: true,
      unit: true,
    },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      nameAr: p.nameAr ?? p.name,
      price: Number(p.price),
      discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
      imageUrl: p.imageUrl,
      stockQuantity: p.stockQuantity,
      isAvailable: p.isAvailable,
      unit: p.unit,
    })),
  });
}
