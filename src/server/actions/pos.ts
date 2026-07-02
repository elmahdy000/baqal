"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { emitTo } from "@/lib/emit";
import { EVENTS, rooms } from "@/lib/realtime";
import { auditLog } from "@/lib/audit";
import type { PaymentMethod } from "@prisma/client";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

type CartLine = {
  productId: string;
  quantity: number;
};

type WalkInInput = {
  items: CartLine[];
  discount?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
};

function generateSaleNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `POS${ts}${rand}`;
}

/**
 * Records a walk-in (in-shop) sale.
 * Mirrors the inventory-decrement pipeline in acceptOrder (src/server/actions/store.ts):
 *  - reads product.stockQuantity
 *  - writes product.stockQuantity = max(0, old - qty)
 *  - inserts InventoryMovement with type=STOCK_OUT (matches the "sale left the shelf" semantics
 *    for a completed in-shop transaction; online orders use ORDER_RESERVED at accept-time)
 *  - flips isAvailable=false on stockouts
 *  - emits INVENTORY_LOW_STOCK / INVENTORY_OUT_OF_STOCK on the store realtime room
 *  - creates LOW_STOCK / OUT_OF_STOCK notifications
 * All wrapped in a single transaction.
 */
export async function createWalkInSale(input: WalkInInput): Promise<ActionResult<{ saleId: string }>> {
  const user = await requireStore();

  if (!input.items || input.items.length === 0) {
    return { ok: false, error: "السلة فارغة" };
  }

  // Deduplicate and validate line items
  const merged = new Map<string, number>();
  for (const line of input.items) {
    if (!line.productId) continue;
    const qty = Math.floor(Number(line.quantity));
    if (!Number.isFinite(qty) || qty <= 0) {
      return { ok: false, error: "الكمية غير صالحة" };
    }
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + qty);
  }
  if (merged.size === 0) {
    return { ok: false, error: "السلة فارغة" };
  }

  const productIds = Array.from(merged.keys());
  const products = await db.product.findMany({
    where: { id: { in: productIds }, storeId: user.storeId },
  });
  if (products.length !== productIds.length) {
    return { ok: false, error: "منتج غير موجود" };
  }

  // Check stock up-front for a fast, clear error
  for (const p of products) {
    const requested = merged.get(p.id) ?? 0;
    if (p.stockQuantity < requested) {
      return {
        ok: false,
        error: `الكمية المطلوبة من "${p.nameAr ?? p.name}" أكبر من المخزون (${p.stockQuantity})`,
      };
    }
  }

  const discount = Math.max(0, Number(input.discount ?? 0));
  const paymentMethod: PaymentMethod = input.paymentMethod ?? "CASH_ON_DELIVERY";

  const lowStockAlerts: { productId: string; name: string; newQty: number; threshold: number }[] = [];
  const outOfStockAlerts: { productId: string; name: string }[] = [];

  const saleNumber = generateSaleNumber();

  const created = await db.$transaction(async (tx) => {
    let subtotal = 0;
    const itemRows: {
      productId: string;
      productNameSnapshot: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[] = [];

    for (const p of products) {
      const qty = merged.get(p.id) ?? 0;
      const unitPrice = Number(p.discountPrice ?? p.price);
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;

      itemRows.push({
        productId: p.id,
        productNameSnapshot: p.nameAr ?? p.name,
        quantity: qty,
        unitPrice,
        totalPrice,
      });

      // Same decrement path used in acceptOrder — read old stock, write new stock,
      // insert InventoryMovement, alert on threshold crossings.
      const newQty = Math.max(0, p.stockQuantity - qty);
      await tx.product.update({
        where: { id: p.id },
        data: {
          stockQuantity: newQty,
          isAvailable: newQty === 0 ? false : p.isAvailable,
        },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: p.id,
          storeId: user.storeId,
          type: "STOCK_OUT",
          quantity: -qty,
          oldQuantity: p.stockQuantity,
          newQuantity: newQty,
          reason: `بيع مباشر ${saleNumber}`,
          createdBy: user.id,
        },
      });

      if (newQty === 0) {
        outOfStockAlerts.push({ productId: p.id, name: p.nameAr ?? p.name });
      } else if (newQty <= p.lowStockThreshold) {
        lowStockAlerts.push({
          productId: p.id,
          name: p.nameAr ?? p.name,
          newQty,
          threshold: p.lowStockThreshold,
        });
      }
    }

    const total = Math.max(0, subtotal - discount);

    const sale = await tx.walkInSale.create({
      data: {
        storeId: user.storeId,
        saleNumber,
        cashierId: user.id,
        subtotal,
        discount,
        total,
        paymentMethod,
        notes: input.notes ?? null,
        items: {
          create: itemRows,
        },
      },
    });

    for (const alert of outOfStockAlerts) {
      await tx.notification.create({
        data: {
          storeId: user.storeId,
          title: "نفاد المخزون",
          body: `المنتج "${alert.name}" نفد من المخزون`,
          type: "OUT_OF_STOCK",
          data: { productId: alert.productId },
        },
      });
    }
    for (const alert of lowStockAlerts) {
      await tx.notification.create({
        data: {
          storeId: user.storeId,
          title: "مخزون منخفض",
          body: `المنتج "${alert.name}" — باقي ${alert.newQty}`,
          type: "LOW_STOCK",
          data: { productId: alert.productId, newQty: alert.newQty },
        },
      });
    }

    return sale;
  });

  for (const alert of outOfStockAlerts) {
    emitTo(rooms.store(user.storeId), EVENTS.INVENTORY_OUT_OF_STOCK, alert);
  }
  for (const alert of lowStockAlerts) {
    emitTo(rooms.store(user.storeId), EVENTS.INVENTORY_LOW_STOCK, alert);
  }

  await auditLog({
    userId: user.id,
    action: "WALK_IN_SALE_CREATED",
    entity: "WalkInSale",
    entityId: created.id,
    metadata: {
      saleNumber: created.saleNumber,
      storeId: user.storeId,
      itemCount: merged.size,
      total: Number(created.total),
    },
  });

  revalidatePath("/store/pos");
  revalidatePath("/store/inventory");
  revalidatePath("/store/products");
  revalidatePath("/store");

  return { ok: true, data: { saleId: created.id } };
}
