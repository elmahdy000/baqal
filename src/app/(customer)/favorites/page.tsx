"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { ProductCard, type ProductCardData } from "@/components/customer/product-card";
import { BottomNav } from "@/components/customer/bottom-nav";
import { Heart, ArrowRight } from "lucide-react";

export default function FavoritesPage() {
  const [cart] = useCart();
  const storeSlug = cart.storeSlug;
  const favorites = useFavorites(storeSlug);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeSlug || favorites.ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const url = `/api/customer/products?ids=${encodeURIComponent(
      favorites.ids.join(",")
    )}&store=${encodeURIComponent(storeSlug)}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products: ProductCardData[] }) => {
        setProducts(data.products);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [storeSlug, favorites.ids]);

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="px-4 py-3 flex items-center gap-3">
          {storeSlug && (
            <Link href={`/s/${storeSlug}`} className="text-gray-500 hover:text-gray-900">
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
          <h1 className="text-lg font-bold text-gray-900">المفضلة</h1>
        </div>
      </header>

      <main className="p-4">
        {!storeSlug ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Heart className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              لسه مفيش مفضلة
            </h2>
            <p className="text-sm text-gray-500">
              اختار بقالة الأول واضف منتجات للمفضلة
            </p>
          </div>
        ) : loading ? (
          <div className="text-center text-gray-500 py-8">جاري التحميل...</div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Heart className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              سلة البيت لسه فاضية
            </h2>
            <p className="text-sm text-gray-500">
              دوس على القلب على أي منتج علشان يظهر هنا
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} storeSlug={storeSlug} />
            ))}
          </div>
        )}
      </main>

      <BottomNav storeSlug={storeSlug} />
    </div>
  );
}
