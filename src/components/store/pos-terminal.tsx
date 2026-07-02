"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Plus,
  Minus,
  Trash2,
  Search,
  ShoppingCart,
  Check,
  Package,
  X,
  Receipt,
  Wallet,
} from "lucide-react";
import { formatEGP, cn } from "@/lib/utils";
import { createWalkInSale } from "@/server/actions/pos";

type POSProduct = {
  id: string;
  name: string;
  nameAr: string | null;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  imageUrl: string | null;
  categoryNameAr: string | null;
  categoryId: string | null;
};

type POSCategory = { id: string; name: string };

type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stockQuantity: number;
};

type Props = {
  products: POSProduct[];
  categories: POSCategory[];
  todaySalesCount: number;
  todaySalesTotal: number;
  lastSale: { saleNumber: string; total: number } | null;
};

/** Utility class to hide native scrollbars (Tailwind 4 has no built-in) */
const HIDE_SCROLL = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function ProductThumb({ product }: { product: POSProduct }) {
  const [broken, setBroken] = useState(false);
  const label = product.nameAr ?? product.name;
  const initial = label.trim().charAt(0) || "؟";
  const showImage = product.imageUrl && !broken;
  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded-md bg-gradient-to-br from-emerald-50 to-green-100">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl!}
          alt={label}
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-3xl font-black text-green-700/40">{initial}</span>
        </div>
      )}
    </div>
  );
}

export function POSTerminal({
  products,
  categories,
  todaySalesCount,
  todaySalesTotal,
  lastSale,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState<string>("0");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setQuery("");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Enter in the search box → add the first filtered product to cart.
  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      const first = filtered.find((p) => p.stockQuantity > 0);
      if (first) {
        addToCart(first);
        setQuery("");
      }
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => {
        if (activeCat && p.categoryId !== activeCat) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.nameAr ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, 200);
  }, [products, query, activeCat]);

  const subtotal = useMemo(
    () => cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [cart]
  );
  const itemCount = cart.reduce((s, l) => s + l.quantity, 0);
  const discountNum = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountNum);
  const cashNum = Number(cashReceived) || 0;
  const change = cashNum > 0 ? Math.max(0, cashNum - total) : 0;

  function addToCart(p: POSProduct) {
    if (p.stockQuantity <= 0) return;
    setError(null);
    setOkMessage(null);
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      const unitPrice = p.discountPrice ?? p.price;
      const displayName = p.nameAr ?? p.name;
      if (existing) {
        if (existing.quantity >= p.stockQuantity) return prev;
        return prev.map((l) =>
          l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: displayName,
          unitPrice,
          quantity: 1,
          stockQuantity: p.stockQuantity,
        },
      ];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.productId !== productId) return l;
          const next = l.quantity + delta;
          if (next <= 0) return { ...l, quantity: 0 };
          if (next > l.stockQuantity) return l;
          return { ...l, quantity: next };
        })
        .filter((l) => l.quantity > 0)
    );
  }

  function setQty(productId: string, raw: string) {
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.productId !== productId) return l;
          const clamped = Math.max(0, Math.min(l.stockQuantity, parsed));
          return { ...l, quantity: clamped };
        })
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  function clearCart() {
    setCart([]);
    setDiscount("0");
    setCashReceived("");
    setNotes("");
    setError(null);
  }

  function handleConfirm() {
    if (cart.length === 0) {
      setError("السلة فاضية");
      return;
    }
    setError(null);
    setOkMessage(null);
    startTransition(async () => {
      const res = await createWalkInSale({
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        discount: discountNum,
        paymentMethod: "CASH_ON_DELIVERY",
        notes: notes.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOkMessage("تم تسجيل البيع بنجاح");
      clearCart();
      searchRef.current?.focus();
    });
  }

  const canConfirm = cart.length > 0 && !pending;

  return (
    // Fills the layout's <main> area exactly (main = flex-1 with p-4/p-6).
    // We take (100dvh - header 64px - main padding 32/48px) so nothing spills.
    <div
      className={cn(
        "flex flex-col gap-2 overflow-hidden",
        "h-[calc(100dvh-6rem)] md:h-[calc(100dvh-7rem)]"
      )}
    >
      {/* ─── Header strip: title + inline KPI chips ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16A34A] text-white">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-[#111827]">نقطة البيع</div>
            <div className="text-[11px] text-[#6B7280]">بيع مباشر من داخل المحل</div>
          </div>
        </div>
        <div className="flex flex-wrap items-stretch gap-2">
          <div className="flex flex-col justify-center rounded-lg bg-[#F0FDF4] px-3 py-1 ring-1 ring-[#BBF7D0]">
            <div className="text-[11px] font-bold text-[#166534]">
              مبيعات اليوم
            </div>
            <div className="text-lg font-black text-[#15803D] tabular-nums leading-tight">
              {formatEGP(todaySalesTotal)}
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-lg bg-[#F8FAFC] px-3 py-1 ring-1 ring-[#E5E7EB]">
            <div className="text-[11px] font-bold text-[#6B7280]">
              عمليات
            </div>
            <div className="text-lg font-black text-[#111827] tabular-nums leading-tight">
              {todaySalesCount}
            </div>
          </div>
          {lastSale && (
            <div className="hidden sm:flex flex-col justify-center rounded-lg bg-[#F8FAFC] px-3 py-1 ring-1 ring-[#E5E7EB]">
              <div className="text-[11px] font-bold text-[#6B7280]">
                آخر عملية
              </div>
              <div className="font-mono text-sm font-black text-[#111827] leading-tight">
                {lastSale.saleNumber}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Main two-column area ─── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ═════ LEFT: search + categories + product grid ═════ */}
        <div className="flex min-h-0 flex-col gap-2">
          {/* Search + categories in a card */}
          <div className="flex flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="ابحث بالاسم أو الباركود... (اضغط / للتركيز)"
                className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 pe-10 text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#16A34A] focus:bg-white focus:ring-2 focus:ring-[#DCFCE7]"
                autoFocus
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

            {categories.length > 0 && (
              <div className={cn("flex gap-1.5 overflow-x-auto", HIDE_SCROLL)}>
                <CatChip
                  active={activeCat === null}
                  onClick={() => setActiveCat(null)}
                  label="الكل"
                  count={products.length}
                />
                {categories.map((c) => {
                  const n = products.filter((p) => p.categoryId === c.id).length;
                  return (
                    <CatChip
                      key={c.id}
                      active={activeCat === c.id}
                      onClick={() =>
                        setActiveCat(c.id === activeCat ? null : c.id)
                      }
                      label={c.name}
                      count={n}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Product grid (scrolls) */}
          <div className={cn("min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-sm", HIDE_SCROLL)}>
            {filtered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-[#9CA3AF]">
                <Package className="h-9 w-9" />
                <p className="text-sm font-semibold text-[#111827]">مفيش نتائج</p>
                <p className="text-xs">جرّب كلمة تانية أو فئة مختلفة.</p>
              </div>
            ) : (
              <div
                className={cn(
                  "grid gap-2",
                  "grid-cols-[repeat(auto-fit,minmax(120px,1fr))]",
                  "sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))]",
                  "lg:grid-cols-[repeat(auto-fit,minmax(135px,1fr))]"
                )}
              >
                {filtered.map((p) => {
                  const isOut = p.stockQuantity === 0;
                  const isLow = p.stockQuantity > 0 && p.stockQuantity <= 5;
                  const unitPrice = p.discountPrice ?? p.price;
                  const hasDiscount =
                    p.discountPrice != null && p.discountPrice < p.price;
                  const inCart = cart.find((l) => l.productId === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      disabled={isOut}
                      className={cn(
                        "group relative flex flex-col gap-1 rounded-xl border bg-white p-1.5 text-right shadow-sm transition-all",
                        isOut
                          ? "cursor-not-allowed border-[#E5E7EB] opacity-50"
                          : "border-[#E5E7EB] hover:-translate-y-0.5 hover:border-[#16A34A] hover:shadow-md active:translate-y-0",
                        inCart && !isOut && "border-[#16A34A] ring-2 ring-[#DCFCE7]"
                      )}
                    >
                      {inCart && (
                        <div className="absolute end-1 top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#16A34A] px-1.5 text-[10px] font-black text-white shadow-md">
                          {inCart.quantity}
                        </div>
                      )}
                      {hasDiscount && !isOut && (
                        <div className="absolute start-1 top-1 z-10 rounded-md bg-[#F97316] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                          خصم
                        </div>
                      )}

                      <ProductThumb product={p} />

                      {isOut && (
                        <div className="absolute inset-1.5 flex items-center justify-center rounded-md bg-black/55 text-[11px] font-bold text-white">
                          نفد
                        </div>
                      )}

                      <div className="flex flex-1 flex-col justify-between gap-1">
                        <div className="line-clamp-2 min-h-[2rem] text-[11px] font-semibold leading-tight text-[#111827]">
                          {p.nameAr ?? p.name}
                        </div>
                        <div className="flex items-end justify-between gap-1">
                          <div className="flex flex-col leading-none">
                            <span className="text-[13px] font-black text-[#16A34A] tabular-nums">
                              {formatEGP(unitPrice)}
                            </span>
                            {hasDiscount && (
                              <span className="mt-0.5 text-[9px] text-[#9CA3AF] line-through tabular-nums">
                                {formatEGP(p.price)}
                              </span>
                            )}
                          </div>
                          <span
                            className={cn(
                              "rounded-md px-1 py-0.5 text-[9px] font-bold tabular-nums",
                              isOut
                                ? "bg-[#FEE2E2] text-[#DC2626]"
                                : isLow
                                  ? "bg-[#FFEDD5] text-[#C2410C]"
                                  : "bg-[#F3F4F6] text-[#6B7280]"
                            )}
                          >
                            {p.stockQuantity}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═════ RIGHT: cart panel ═════ */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
          {/* Cart header */}
          <div className="flex items-center justify-between border-b border-[#F3F4F6] bg-gradient-to-l from-[#F0FDF4] to-white px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingCart className="h-4.5 w-4.5 text-[#166534]" />
                {itemCount > 0 && (
                  <span className="absolute -end-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#16A34A] px-1 text-[9px] font-black text-white">
                    {itemCount}
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-[#111827]">السلة</div>
              {cart.length > 0 && (
                <div className="text-[10px] text-[#6B7280]">
                  · {cart.length} صنف
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="rounded-md px-2 py-0.5 text-[11px] font-bold text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
              >
                تفريغ
              </button>
            )}
          </div>

          {/* Cart lines OR useful empty state */}
          <div className={cn("min-h-0 flex-1 overflow-y-auto", HIDE_SCROLL)}>
            {cart.length === 0 ? (
              <EmptyCart />
            ) : (
              <ul className="flex flex-col divide-y divide-[#F3F4F6]">
                {cart.map((l) => (
                  <li
                    key={l.productId}
                    className="group flex items-center gap-1.5 px-2.5 py-1.5 transition hover:bg-[#F8FAFC]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-bold text-[#111827]">
                        {l.name}
                      </div>
                      <div className="text-[10px] text-[#6B7280] tabular-nums">
                        {formatEGP(l.unitPrice)} × {l.quantity} ={" "}
                        <span className="font-bold text-[#16A34A]">
                          {formatEGP(l.unitPrice * l.quantity)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 rounded-md bg-[#F3F4F6] p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQty(l.productId, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded text-[#6B7280] transition hover:bg-white hover:text-[#DC2626]"
                        aria-label="تقليل"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={l.stockQuantity}
                        value={l.quantity}
                        onChange={(e) => setQty(l.productId, e.target.value)}
                        className="h-6 w-8 rounded bg-transparent text-center text-[11px] font-black text-[#111827] outline-none focus:bg-white focus:ring-1 focus:ring-[#16A34A]"
                      />
                      <button
                        type="button"
                        onClick={() => updateQty(l.productId, 1)}
                        disabled={l.quantity >= l.stockQuantity}
                        className="flex h-6 w-6 items-center justify-center rounded text-[#6B7280] transition hover:bg-white hover:text-[#16A34A] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="زيادة"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(l.productId)}
                      className="flex h-6 w-6 items-center justify-center rounded text-[#9CA3AF] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                      aria-label="حذف"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sticky totals footer (never clipped) */}
          <div className="shrink-0 border-t border-[#E5E7EB] bg-white p-2.5">
            <div className="flex flex-col gap-1.5">
              {/* Subtotal + discount row */}
              <div className="flex items-center gap-2 text-[11px]">
                <div className="flex flex-1 items-center justify-between rounded-md bg-[#F8FAFC] px-2 py-1 ring-1 ring-[#F3F4F6]">
                  <span className="text-[#6B7280]">الفرعي</span>
                  <span className="font-bold text-[#111827] tabular-nums">
                    {formatEGP(subtotal)}
                  </span>
                </div>
                <label className="flex flex-1 items-center gap-1 rounded-md bg-[#F8FAFC] px-2 py-0.5 ring-1 ring-[#F3F4F6] focus-within:ring-[#16A34A]">
                  <span className="text-[#6B7280]">خصم</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="h-6 w-full min-w-0 rounded bg-transparent text-left text-[11px] font-bold outline-none tabular-nums"
                  />
                </label>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-lg bg-[#DCFCE7] px-3 py-1.5 ring-1 ring-[#BBF7D0]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">
                  الإجمالي
                </span>
                <span className="text-lg font-black text-[#15803D] tabular-nums leading-none">
                  {formatEGP(total)}
                </span>
              </div>

              {/* Cash + change (single tight row) */}
              <div className="flex items-center gap-2 text-[11px]">
                <label className="flex flex-1 items-center gap-1 rounded-md bg-[#F8FAFC] px-2 py-0.5 ring-1 ring-[#F3F4F6] focus-within:ring-[#16A34A]">
                  <Wallet className="h-3 w-3 shrink-0 text-[#6B7280]" />
                  <span className="text-[#6B7280]">مستلم</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="—"
                    className="h-6 w-full min-w-0 rounded bg-transparent text-left text-[11px] font-bold outline-none tabular-nums placeholder:text-[#9CA3AF]"
                  />
                </label>
                {cashNum > 0 ? (
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-between rounded-md px-2 py-1 ring-1 tabular-nums",
                      cashNum >= total
                        ? "bg-[#F0FDF4] text-[#166534] ring-[#BBF7D0]"
                        : "bg-[#FEF2F2] text-[#991B1B] ring-[#FECACA]"
                    )}
                  >
                    <span>{cashNum >= total ? "الباقي" : "ناقص"}</span>
                    <span className="font-black">
                      {formatEGP(cashNum >= total ? change : total - cashNum)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-between rounded-md bg-[#F8FAFC] px-2 py-1 text-[#9CA3AF] ring-1 ring-[#F3F4F6]">
                    <span>الباقي</span>
                    <span className="font-bold">—</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-1.5 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-2 py-1 text-[11px] font-bold text-[#991B1B]">
                  <X className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}
              {okMessage && (
                <div className="flex items-center gap-1.5 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-2 py-1 text-[11px] font-bold text-[#166534]">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  {okMessage}
                </div>
              )}

              {/* Confirm button — always visible, clearly disabled state */}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={cn(
                  "flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-black shadow-sm transition-all",
                  canConfirm
                    ? "bg-[#16A34A] text-white hover:bg-[#15803D] active:translate-y-px"
                    : "cursor-not-allowed bg-[#F3F4F6] text-[#9CA3AF]"
                )}
              >
                {pending ? (
                  <span>جاري الحفظ...</span>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>تأكيد البيع</span>
                    <span className="tabular-nums">· {formatEGP(total)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition",
        active
          ? "bg-[#16A34A] text-white shadow-sm"
          : "bg-[#F8FAFC] text-[#374151] ring-1 ring-[#E5E7EB] hover:bg-[#F3F4F6]"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0 text-[9px] font-black tabular-nums",
          active ? "bg-white/25 text-white" : "bg-white text-[#6B7280]"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyCart() {
  const tips = [
    { k: "/", v: "تركيز على البحث" },
    { k: "Enter", v: "إضافة أول نتيجة للسلة" },
    { k: "Esc", v: "مسح البحث" },
  ];
  return (
    <div className="flex h-full flex-col justify-between gap-3 p-3">
      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#F8FAFC] p-4 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DCFCE7]">
          <ShoppingCart className="h-5 w-5 text-[#16A34A]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#111827]">السلة فاضية</p>
          <p className="mt-0.5 text-[11px] text-[#6B7280]">
            دوس على أي منتج علشان تضيفه للسلة
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
          اختصارات الكيبورد
        </div>
        <ul className="flex flex-col gap-1">
          {tips.map((t) => (
            <li
              key={t.k}
              className="flex items-center justify-between rounded-md bg-[#F8FAFC] px-2 py-1.5 ring-1 ring-[#F3F4F6]"
            >
              <span className="text-[11px] text-[#374151]">{t.v}</span>
              <kbd className="rounded border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[10px] font-black text-[#111827] shadow-sm">
                {t.k}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
