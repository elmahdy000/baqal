import Link from "next/link";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import type { InventoryMovementType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { productUnitLabel } from "@/lib/labels";
import { InventoryList, type InventoryProduct } from "@/components/store/inventory-list";
import {
  AlertCircle,
  AlertTriangle,
  Package,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  History,
} from "lucide-react";

export const dynamic = "force-dynamic";

type MoveMeta = {
  label: string;
  short: string;
  bg: string;
  fg: string;
  ring: string;
  positive: boolean | null; // null = context-dependent (uses sign)
};

const MOVE: Record<InventoryMovementType, MoveMeta> = {
  STOCK_IN: {
    label: "دخول بضاعة",
    short: "دخول",
    bg: "bg-[#F0FDF4]",
    fg: "text-[#166534]",
    ring: "ring-[#BBF7D0]",
    positive: true,
  },
  STOCK_OUT: {
    label: "خروج بضاعة",
    short: "خروج",
    bg: "bg-[#FEF2F2]",
    fg: "text-[#991B1B]",
    ring: "ring-[#FECACA]",
    positive: false,
  },
  ORDER_RESERVED: {
    label: "بيع لطلب",
    short: "طلب",
    bg: "bg-[#FEF3C7]",
    fg: "text-[#92400E]",
    ring: "ring-[#FDE68A]",
    positive: false,
  },
  ORDER_CANCELLED: {
    label: "إعادة من إلغاء طلب",
    short: "إلغاء",
    bg: "bg-[#DBEAFE]",
    fg: "text-[#1E40AF]",
    ring: "ring-[#BFDBFE]",
    positive: true,
  },
  MANUAL_ADJUSTMENT: {
    label: "تعديل جرد يدوي",
    short: "تعديل",
    bg: "bg-[#F3F4F6]",
    fg: "text-[#374151]",
    ring: "ring-[#E5E7EB]",
    positive: null,
  },
  DAMAGED: {
    label: "تالف",
    short: "تالف",
    bg: "bg-[#FEF2F2]",
    fg: "text-[#991B1B]",
    ring: "ring-[#FECACA]",
    positive: false,
  },
  EXPIRED: {
    label: "منتهي الصلاحية",
    short: "منتهي",
    bg: "bg-[#FEF2F2]",
    fg: "text-[#991B1B]",
    ring: "ring-[#FECACA]",
    positive: false,
  },
  RETURNED: {
    label: "مرتجع",
    short: "مرتجع",
    bg: "bg-[#DBEAFE]",
    fg: "text-[#1E40AF]",
    ring: "ring-[#BFDBFE]",
    positive: true,
  },
};

export default async function InventoryPage() {
  const user = await requireStore();
  const storeId = user.storeId;

  const [products, movements, totals] = await Promise.all([
    db.product.findMany({
      where: { storeId },
      include: { category: true },
      orderBy: [{ stockQuantity: "asc" }, { name: "asc" }],
      take: 500,
    }),
    db.inventoryMovement.findMany({
      where: { storeId },
      include: { product: { select: { name: true, nameAr: true, imageUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    (async () => {
      const [totalCount, availableCount, valueAgg] = await Promise.all([
        db.product.count({ where: { storeId } }),
        db.product.count({ where: { storeId, isAvailable: true } }),
        db.$queryRaw<{ v: number | null }[]>`
          SELECT SUM("stockQuantity" * "price")::float8 AS v
          FROM "Product"
          WHERE "storeId" = ${storeId}
        `,
      ]);
      return {
        totalCount,
        availableCount,
        totalValue: Number(valueAgg[0]?.v ?? 0),
      };
    })(),
  ]);

  const inventoryProducts: InventoryProduct[] = products.map((p) => ({
    id: p.id,
    name: p.nameAr ?? p.name,
    stockQuantity: p.stockQuantity,
    lowStockThreshold: p.lowStockThreshold,
    imageUrl: p.imageUrl,
    categoryName: p.category?.nameAr ?? p.category?.name ?? null,
    unit: productUnitLabel(p.unit),
    price: Number(p.price),
  }));

  const outCount = inventoryProducts.filter((p) => p.stockQuantity === 0).length;
  const lowCount = inventoryProducts.filter(
    (p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
  ).length;
  const okCount = inventoryProducts.length - outCount - lowCount;

  return (
    <div className="flex flex-col gap-5">
      {/* Title + primary action */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">إدارة المخزون</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            متابعة الأرصدة، تسجيل الاستلامات والتوالف، ومراقبة حركة كل صنف
          </p>
        </div>
        <Link
          href="/store/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white px-3.5 py-2 text-xs font-bold transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          منتج جديد
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="إجمالي الأصناف"
          value={totals.totalCount.toString()}
          hint={`${totals.availableCount} متاح`}
          icon={Boxes}
          tone="neutral"
        />
        <KpiCard
          label="نفد المخزون"
          value={outCount.toString()}
          hint="محتاج تزويد فوري"
          icon={AlertCircle}
          tone="danger"
        />
        <KpiCard
          label="مخزون منخفض"
          value={lowCount.toString()}
          hint="قرب يخلص"
          icon={AlertTriangle}
          tone="warn"
        />
        <KpiCard
          label="متوفر بحالة جيدة"
          value={okCount.toString()}
          hint={`قيمة المخزون: ${totals.totalValue.toFixed(0)} ج.م`}
          icon={Package}
          tone="success"
        />
      </div>

      {/* Products list */}
      <InventoryList products={inventoryProducts} />

      {/* Movements */}
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-4 py-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#6B7280]" />
            <div className="text-sm font-bold text-[#111827]">آخر حركات المخزون</div>
            <span className="rounded-full bg-[#F3F4F6] text-[#6B7280] text-[10px] font-bold px-2 py-0.5">
              {movements.length}
            </span>
          </div>
          <div className="text-[11px] text-[#6B7280]">
            آخر 25 حركة
          </div>
        </div>
        {movements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-[#9CA3AF]">
            <History className="h-8 w-8" />
            <p className="text-sm font-semibold text-[#111827]">لسه مفيش حركات مخزون</p>
            <p className="text-xs">أي بيع أو استلام هيظهر هنا مع تاريخ الرصيد.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F3F4F6]">
            {movements.map((m) => {
              const meta = MOVE[m.type];
              const productName = m.product.nameAr ?? m.product.name;
              // Delta is authoritative — display absolute value with an arrow.
              const isPositive = m.quantity > 0;
              const abs = Math.abs(m.quantity);
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-[#F8FAFC]"
                >
                  {/* Direction icon */}
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      isPositive
                        ? "bg-[#F0FDF4] text-[#166534]"
                        : "bg-[#FEF2F2] text-[#991B1B]"
                    )}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4" />
                    )}
                  </div>

                  {/* Product + reason */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-[13px] font-bold text-[#111827]">
                        {productName}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1",
                          meta.bg,
                          meta.fg,
                          meta.ring
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-[#6B7280]">
                      {m.reason ?? "—"} · {format(m.createdAt, "yyyy/MM/dd HH:mm", { locale: arEG })}
                    </div>
                  </div>

                  {/* Delta */}
                  <div className="hidden shrink-0 flex-col items-center sm:flex">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      التغيير
                    </div>
                    <div
                      className={cn(
                        "text-sm font-black tabular-nums leading-none",
                        isPositive ? "text-[#16A34A]" : "text-[#DC2626]"
                      )}
                    >
                      {isPositive ? "+" : "−"}
                      {abs}
                    </div>
                  </div>

                  {/* Before → After (LTR-isolated to keep arrow direction correct in RTL) */}
                  <div className="shrink-0 rounded-lg bg-[#F8FAFC] px-2.5 py-1.5 ring-1 ring-[#E5E7EB]">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                      الرصيد
                    </div>
                    <div
                      dir="ltr"
                      className="flex items-baseline gap-1 text-sm font-black tabular-nums text-[#111827]"
                    >
                      <span className="text-[#6B7280] font-bold">{m.oldQuantity}</span>
                      <span className="text-[#9CA3AF]">→</span>
                      <span>{m.newQuantity}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "neutral" | "success" | "warn" | "danger";
}) {
  const toneMap = {
    neutral: { bg: "bg-[#F3F4F6]", fg: "text-[#374151]", value: "text-[#111827]" },
    success: { bg: "bg-[#DCFCE7]", fg: "text-[#166534]", value: "text-[#15803D]" },
    warn: { bg: "bg-[#FFEDD5]", fg: "text-[#C2410C]", value: "text-[#C2410C]" },
    danger: { bg: "bg-[#FEE2E2]", fg: "text-[#DC2626]", value: "text-[#DC2626]" },
  }[tone];
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium text-[#6B7280]">{label}</div>
          <div
            className={cn(
              "mt-1.5 text-2xl font-black tracking-tight tabular-nums",
              toneMap.value
            )}
          >
            {value}
          </div>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            toneMap.bg,
            toneMap.fg
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 border-t border-[#F3F4F6] pt-2 text-[11px] text-[#6B7280]">
        {hint}
      </div>
    </div>
  );
}
