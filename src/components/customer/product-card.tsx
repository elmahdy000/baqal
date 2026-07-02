"use client";

import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { formatEGP, cn } from "@/lib/utils";
import { Minus, Plus, Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export type ProductCardData = {
  id: string;
  nameAr: string;
  price: number;
  discountPrice?: number | null;
  imageUrl?: string | null;
  stockQuantity: number;
  isAvailable: boolean;
  unit?: string | null;
};

export function ProductCard({
  product,
  storeSlug,
  buildingCode,
}: {
  product: ProductCardData;
  storeSlug: string;
  buildingCode?: string;
}) {
  const [cart, api] = useCart();
  const favorites = useFavorites(storeSlug);
  const isFav = favorites.has(product.id);
  const item = cart.items.find((i) => i.productId === product.id);
  const qty = item?.quantity ?? 0;

  const activePrice = product.discountPrice ?? product.price;
  const outOfStock = !product.isAvailable || product.stockQuantity <= 0;

  const initial = (product.nameAr?.trim()?.[0] ?? "ب").slice(0, 1);

  function handleAdd() {
    if (outOfStock) return;
    if (qty + 1 > product.stockQuantity) {
      toast.error("الكمية أكبر من المتاح");
      return;
    }
    api.addItem(
      storeSlug,
      {
        productId: product.id,
        quantity: 1,
        snapshot: {
          name: product.nameAr,
          price: activePrice,
          imageUrl: product.imageUrl ?? undefined,
        },
      },
      buildingCode
    );
  }

  function handleInc() {
    if (qty + 1 > product.stockQuantity) {
      toast.error("خلص المخزون");
      return;
    }
    api.setQty(product.id, qty + 1);
  }

  function handleDec() {
    api.setQty(product.id, qty - 1);
  }

  const detailHref = `/s/${storeSlug}/products/${product.id}${
    buildingCode ? `?bcode=${buildingCode}` : ""
  }`;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300 group">
      <Link
        href={detailHref}
        className="aspect-square bg-slate-50 flex items-center justify-center relative overflow-hidden"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.nameAr}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-50/50 to-green-100/30 flex flex-col items-center justify-center gap-1.5 p-4">
            <span className="h-10 w-10 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#16A34A] shadow-sm">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="text-[10px] text-slate-400 font-bold">لا توجد صورة</span>
          </div>
        )}
        {product.discountPrice && (
          <span className="absolute top-2 right-2 rounded-full bg-[#F97316] text-white text-[10px] font-black px-2 py-0.5 shadow-sm animate-pulse">
            خصم {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const nowFav = favorites.toggle(product.id);
            toast.success(nowFav ? "تمت الإضافة للمفضلة" : "تم الحذف من المفضلة");
          }}
          aria-label={isFav ? "إزالة من المفضلة" : "أضف للمفضلة"}
          className={cn(
            "absolute top-2 left-2 h-9 w-9 rounded-full flex items-center justify-center shadow-sm border transition-all duration-200 active:scale-90",
            isFav
              ? "bg-red-50 border-red-100 text-red-500 hover:bg-red-100"
              : "bg-white/90 backdrop-blur border-slate-200 text-slate-500 hover:bg-white"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isFav ? "fill-red-500 text-red-500 scale-110" : "text-slate-500"
            )}
          />
        </button>
      </Link>
      <div className="p-3 flex flex-col flex-1 gap-2.5">
        <Link href={detailHref} className="block">
          <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2 min-h-[2.5rem] leading-normal hover:text-[#16A34A] transition-colors">
            {product.nameAr}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-black text-[#15803D] font-mono">
            {formatEGP(activePrice)}
          </span>
          {product.discountPrice && (
            <span className="text-xs text-slate-400 line-through font-bold font-mono">
              {formatEGP(product.price)}
            </span>
          )}
        </div>
        {outOfStock ? (
          <Button variant="outline" size="sm" disabled className="mt-auto rounded-xl border-slate-200 text-slate-405 text-xs font-bold h-9">
            غير متاح
          </Button>
        ) : qty === 0 ? (
          (product.unit === "KG" || product.unit === "GRAM") ? (
            <Button
              asChild
              size="sm"
              className="mt-auto bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold rounded-xl transition-all duration-200 shadow-sm shadow-orange-600/10 h-9 text-xs"
            >
              <Link href={detailHref}>
                اختر الوزن
              </Link>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleAdd}
              className="mt-auto bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold rounded-xl transition-all duration-200 transform active:scale-95 shadow-sm shadow-green-600/10 h-9 text-xs"
            >
              + أضف للسلة
            </Button>
          )
        ) : (
          <div className="mt-auto flex items-center justify-between gap-2 rounded-xl bg-[#ECFDF5] border border-[#DCFCE7] text-[#15803D] px-1 py-1 shadow-sm h-9">
            <button
              onClick={handleDec}
              className="h-7 w-7 rounded-lg hover:bg-[#DCFCE7] flex items-center justify-center transition-colors text-[#15803D] active:scale-90"
              aria-label="نقص"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="font-black text-sm w-6 text-center font-mono">{qty}</span>
            <button
              onClick={handleInc}
              className="h-7 w-7 rounded-lg hover:bg-[#DCFCE7] flex items-center justify-center transition-colors text-[#15803D] active:scale-90"
              aria-label="زيادة"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
