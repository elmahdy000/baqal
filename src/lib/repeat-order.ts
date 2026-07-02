// Client-side helper to re-add all items from a past order to the cart.

import { addItem } from "@/lib/cart";

type RepeatOrderInput = {
  store: { slug: string };
  building?: { code?: string | null } | null;
  items: Array<{
    productId: string;
    productNameSnapshot: string;
    quantity: number;
    unitPrice: number;
    product?: {
      id: string;
      nameAr?: string | null;
      name?: string | null;
      imageUrl?: string | null;
      stockQuantity: number;
      isAvailable: boolean;
    } | null;
  }>;
};

export type RepeatOrderResult = {
  added: number;
  skipped: Array<{ name: string; reason: string }>;
};

export function repeatOrder(order: RepeatOrderInput): RepeatOrderResult {
  const storeSlug = order.store.slug;
  const buildingCode = order.building?.code ?? undefined;
  let added = 0;
  const skipped: Array<{ name: string; reason: string }> = [];

  for (const item of order.items) {
    const displayName =
      item.product?.nameAr ??
      item.product?.name ??
      item.productNameSnapshot;

    if (!item.product) {
      skipped.push({ name: displayName, reason: "غير متاح" });
      continue;
    }
    if (!item.product.isAvailable) {
      skipped.push({ name: displayName, reason: "غير متاح" });
      continue;
    }
    if (item.product.stockQuantity <= 0) {
      skipped.push({ name: displayName, reason: "خلص من المخزون" });
      continue;
    }

    const qty = Math.min(item.quantity, item.product.stockQuantity);

    addItem(
      storeSlug,
      {
        productId: item.productId,
        quantity: qty,
        snapshot: {
          name: displayName,
          price: item.unitPrice,
          imageUrl: item.product.imageUrl ?? undefined,
        },
      },
      buildingCode
    );
    added++;
  }

  return { added, skipped };
}
