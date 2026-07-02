"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import type { ProductCardData } from "@/components/customer/product-card";

export function AddAllButton({
  products,
  storeSlug,
  buildingCode,
  label = "أضف الكل للسلة",
}: {
  products: ProductCardData[];
  storeSlug: string;
  buildingCode?: string;
  label?: string;
}) {
  const [, api] = useCart();

  function handleClick() {
    let added = 0;
    let skipped = 0;
    for (const p of products) {
      if (!p.isAvailable || p.stockQuantity <= 0) {
        skipped++;
        continue;
      }
      const price = p.discountPrice ?? p.price;
      api.addItem(
        storeSlug,
        {
          productId: p.id,
          quantity: 1,
          snapshot: {
            name: p.nameAr,
            price,
            imageUrl: p.imageUrl ?? undefined,
          },
        },
        buildingCode
      );
      added++;
    }
    if (added === 0) {
      toast.error("مفيش منتجات متاحة");
      return;
    }
    if (skipped > 0) {
      toast.success(`تم إضافة ${added} — تم تخطي ${skipped}`);
    } else {
      toast.success(`تم إضافة ${added} منتجات للسلة`);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick}>
      {label}
    </Button>
  );
}
