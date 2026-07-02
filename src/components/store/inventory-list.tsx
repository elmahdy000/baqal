"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Package, Search, X, Edit3, ExternalLink } from "lucide-react";
import { AdjustStockDialog } from "@/components/store/adjust-stock-dialog";
import { cn } from "@/lib/utils";

export type InventoryProduct = {
  id: string;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl: string | null;
  categoryName: string | null;
  unit: string;
  price: number;
};

type StockState = "out" | "low" | "ok";

function stateOf(p: InventoryProduct): StockState {
  if (p.stockQuantity === 0) return "out";
  if (p.stockQuantity <= p.lowStockThreshold) return "low";
  return "ok";
}

const FILTERS: { key: "all" | StockState; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "out", label: "نفد" },
  { key: "low", label: "مخزون منخفض" },
  { key: "ok", label: "متوفر" },
];

function ProductThumb({ product }: { product: InventoryProduct }) {
  const [broken, setBroken] = useState(false);
  const initial = product.name.trim().charAt(0) || "؟";
  const show = product.imageUrl && !broken;
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-50 to-green-100 ring-1 ring-[#E5E7EB]">
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl!}
          alt={product.name}
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-sm font-black text-green-700/40">{initial}</span>
        </div>
      )}
    </div>
  );
}

export function InventoryList({ products }: { products: InventoryProduct[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | StockState>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const s = stateOf(p);
      if (filter !== "all" && s !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.categoryName ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, filter]);

  const counts = useMemo(() => {
    let out = 0,
      low = 0,
      ok = 0;
    for (const p of products) {
      const s = stateOf(p);
      if (s === "out") out++;
      else if (s === "low") low++;
      else ok++;
    }
    return { out, low, ok, all: products.length };
  }, [products]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search + filter */}
      <div className="flex flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن منتج أو فئة..."
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 pe-10 text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#16A34A] focus:bg-white focus:ring-2 focus:ring-[#DCFCE7]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute start-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#111827]"
              aria-label="مسح"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const n =
              f.key === "all"
                ? counts.all
                : f.key === "out"
                  ? counts.out
                  : f.key === "low"
                    ? counts.low
                    : counts.ok;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition",
                  active
                    ? "bg-[#16A34A] text-white shadow-sm"
                    : "bg-[#F8FAFC] text-[#374151] ring-1 ring-[#E5E7EB] hover:bg-[#F3F4F6]"
                )}
              >
                <span>{f.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0 text-[9px] font-black tabular-nums",
                    active ? "bg-white/25 text-white" : "bg-white text-[#6B7280]"
                  )}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rows */}
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-[#9CA3AF]">
            <Package className="h-8 w-8" />
            <p className="text-sm font-semibold text-[#111827]">مفيش نتائج</p>
            <p className="text-xs">جرّب كلمة تانية أو غيّر الفلتر.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F3F4F6]">
            {rows.map((p) => (
              <InventoryRow key={p.id} product={p} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InventoryRow({ product }: { product: InventoryProduct }) {
  const s = stateOf(product);
  const stateMeta = {
    out: {
      icon: AlertCircle,
      label: "نفد المخزون",
      ring: "bg-[#FEE2E2] text-[#DC2626]",
    },
    low: {
      icon: AlertTriangle,
      label: `مخزون منخفض (حد ${product.lowStockThreshold})`,
      ring: "bg-[#FFEDD5] text-[#C2410C]",
    },
    ok: {
      icon: Package,
      label: "متوفر",
      ring: "bg-[#F0FDF4] text-[#166534]",
    },
  }[s];
  const Icon = stateMeta.icon;

  return (
    <li className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[#F8FAFC]">
      <ProductThumb product={product} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/store/products/${product.id}/edit`}
            className="truncate text-[13px] font-bold text-[#111827] hover:text-[#16A34A]"
          >
            {product.name}
          </Link>
          {product.categoryName && (
            <span className="shrink-0 rounded-md bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] font-bold text-[#6B7280]">
              {product.categoryName}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#6B7280]">
          <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold", stateMeta.ring)}>
            <Icon className="h-3 w-3" />
            {stateMeta.label}
          </span>
          <span>سعر: {product.price.toFixed(2)} ج.م</span>
          {product.unit && <span>· {product.unit}</span>}
        </div>
      </div>

      {/* Stock number */}
      <div className="hidden shrink-0 flex-col items-end sm:flex">
        <div className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
          الكمية
        </div>
        <div
          className={cn(
            "text-lg font-black tabular-nums leading-none",
            s === "out"
              ? "text-[#DC2626]"
              : s === "low"
                ? "text-[#C2410C]"
                : "text-[#111827]"
          )}
        >
          {product.stockQuantity}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <AdjustStockDialog
          product={{
            id: product.id,
            name: product.name,
            stockQuantity: product.stockQuantity,
            unit: product.unit,
          }}
          trigger={
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#16A34A] px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-[#15803D]"
              aria-label="تعديل مخزون"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">تعديل</span>
            </button>
          }
        />
        <Link
          href={`/store/products/${product.id}/edit`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] transition hover:bg-[#F8FAFC] hover:text-[#111827]"
          aria-label="فتح المنتج"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </li>
  );
}
