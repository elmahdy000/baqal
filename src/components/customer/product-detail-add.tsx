"use client";

import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, MessageSquare, Scale, Banknote } from "lucide-react";
import { toast } from "sonner";
import { ProductUnit } from "@prisma/client";
import { formatEGP } from "@/lib/utils";

type Product = {
  id: string;
  nameAr: string;
  price: number;
  imageUrl?: string | null;
  stockQuantity: number;
  isAvailable: boolean;
  unit?: ProductUnit;
};

const WEIGHT_PRESETS = [
  "ربع كيلو",
  "نصف كيلو",
  "كيلو",
  "كيلو ونصف",
  "2 كيلو",
];

const PRICE_PRESETS = [
  "بـ 10 جنيه",
  "بـ 20 جنيه",
  "بـ 50 جنيه",
  "بـ 100 جنيه",
];

export function ProductDetailAdd({
  product,
  storeSlug,
  buildingCode,
}: {
  product: Product;
  storeSlug: string;
  buildingCode?: string;
}) {
  const [cart, api] = useCart();
  const [customText, setCustomText] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const outOfStock = !product.isAvailable || product.stockQuantity <= 0;
  const isWeightUnit = product.unit === "KG" || product.unit === "GRAM";

  // Filter items in cart belonging to this product
  const itemsInCart = cart.items.filter((i) => i.productId === product.id);

  function handleAddStandard() {
    if (outOfStock) return;
    api.addItem(
      storeSlug,
      {
        productId: product.id,
        quantity: 1,
        snapshot: {
          name: product.nameAr,
          price: product.price,
          imageUrl: product.imageUrl ?? undefined,
        },
      },
      buildingCode
    );
    toast.success("تمت الإضافة للسلة");
  }

  function addWithNote(note: string) {
    if (outOfStock) return;
    api.addItem(
      storeSlug,
      {
        productId: product.id,
        quantity: 1,
        notes: note,
        snapshot: {
          name: product.nameAr,
          price: product.price,
          imageUrl: product.imageUrl ?? undefined,
        },
      },
      buildingCode
    );
    toast.success(`تمت إضافة ${note} للسلة`);
    setCustomText("");
    setShowCustomInput(false);
  }

  if (outOfStock) {
    return (
      <Button disabled className="w-full rounded-2xl py-4 h-auto text-base font-extrabold" size="lg">
        غير متاح حالياً
      </Button>
    );
  }

  if (isWeightUnit) {
    return (
      <div className="space-y-6">
        {/* Preset Selector Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
          <div className="text-xs font-black text-slate-500 mb-1 flex items-center gap-1">
            <Scale className="h-4 w-4 text-[#F97316]" />
            <span>اختر الوزن المطلوب:</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {WEIGHT_PRESETS.map((w) => (
              <button
                key={w}
                onClick={() => addWithNote(w)}
                className="py-2.5 px-2 rounded-xl text-xs font-extrabold bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-orange-50 hover:border-orange-200 hover:text-[#EA580C] transition-all duration-200 text-center active:scale-95"
              >
                {w}
              </button>
            ))}
            <button
              onClick={() => addWithNote("1 كجم")}
              className="py-2.5 px-2 rounded-xl text-xs font-extrabold bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-orange-50 hover:border-orange-200 hover:text-[#EA580C] transition-all duration-205 text-center active:scale-95"
            >
              1 كجم
            </button>
          </div>

          <div className="text-xs font-black text-slate-500 mt-2 mb-1 flex items-center gap-1">
            <Banknote className="h-4 w-4 text-emerald-600" />
            <span>أو اطلب بسعر معين:</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {PRICE_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => addWithNote(p)}
                className="py-2 px-1 rounded-xl text-xs font-extrabold bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#16A34A] transition-all duration-200 text-center active:scale-95"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div className="pt-2 border-t border-slate-100">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full py-2.5 text-xs font-extrabold text-slate-500 hover:text-slate-850 flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>طلب وزن أو سعر مخصص...</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="مثال: ربع كيلو إلا ثمن، أو بـ 15 جنيه"
                    className="flex-1 min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#16A34A] bg-slate-50"
                  />
                  <Button
                    onClick={() => {
                      if (!customText.trim()) {
                        toast.error("اكتب طلبك الأول");
                        return;
                      }
                      addWithNote(customText.trim());
                    }}
                    className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-black rounded-xl px-4 py-2"
                  >
                    إضافة
                  </Button>
                </div>
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Standard option button */}
        {itemsInCart.length === 0 && (
          <Button
            onClick={handleAddStandard}
            className="w-full bg-[#0c4a3b] hover:bg-[#093d31] text-white font-black rounded-2xl py-4 h-auto text-sm transition-all transform active:scale-95 duration-200"
          >
            أضف 1 كجم (افتراضي)
          </Button>
        )}

        {/* List of currently added configurations */}
        {itemsInCart.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>المضاف في السلة حالياً:</span>
              <span className="bg-[#16A34A]/10 text-[#16A34A] rounded-full px-2 py-0.5 text-[10px] font-extrabold">
                {itemsInCart.reduce((acc, curr) => acc + curr.quantity, 0)} طلبات
              </span>
            </h4>
            <div className="space-y-2">
              {itemsInCart.map((cartItem) => (
                <div
                  key={cartItem.notes || "standard"}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-slate-900 truncate">
                      {cartItem.notes || "كمية افتراضية (1 كجم)"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold mt-0.5 font-mono">
                      {formatEGP(product.price * cartItem.quantity)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200/60 bg-white p-0.5 shadow-sm">
                    <button
                      onClick={() => api.setQty(product.id, cartItem.quantity - 1, cartItem.notes)}
                      className="h-7 w-7 flex items-center justify-center hover:bg-emerald-50 text-slate-600 hover:text-[#16A34A] rounded-md transition-colors active:scale-90"
                      aria-label="نقص"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-black w-6 text-center font-mono text-[#16A34A]">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (cartItem.quantity + 1 > product.stockQuantity) {
                          toast.error("خلص المخزون");
                          return;
                        }
                        api.setQty(product.id, cartItem.quantity + 1, cartItem.notes);
                      }}
                      className="h-7 w-7 flex items-center justify-center hover:bg-emerald-50 text-slate-600 hover:text-[#16A34A] rounded-md transition-colors active:scale-90"
                      aria-label="زيادة"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="text-[10px] text-slate-400 font-bold text-center pt-1">
                يمكنك إضافة أوزان أو أسعار أخرى من الأعلى
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Non-weight items: standard count selectors
  const qty = itemsInCart[0]?.quantity ?? 0;

  if (qty === 0) {
    return (
      <Button
        onClick={handleAddStandard}
        className="w-full bg-[#0c4a3b] hover:bg-[#093d31] text-white font-black rounded-2xl shadow-lg shadow-[#0c4a3b]/10 py-4 h-auto text-base transition-all transform active:scale-95 duration-200"
        size="lg"
      >
        <ShoppingCart className="h-5 w-5 ml-2" />
        أضف للسلة
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#0c4a3b] text-white p-2.5 shadow-lg shadow-[#0c4a3b]/10">
      <button
        onClick={() => api.setQty(product.id, qty - 1)}
        className="h-12 w-12 rounded-xl hover:bg-[#093d31] flex items-center justify-center transition-all transform active:scale-90 duration-150"
        aria-label="نقص"
      >
        <Minus className="h-5 w-5" />
      </button>
      <div className="text-center">
        <div className="text-[10px] opacity-75 font-bold">الكمية</div>
        <div className="text-2xl font-black font-mono leading-none mt-0.5">{qty}</div>
      </div>
      <button
        onClick={() => {
          if (qty + 1 > product.stockQuantity) {
            toast.error("خلص المخزون");
            return;
          }
          api.setQty(product.id, qty + 1);
        }}
        className="h-12 w-12 rounded-xl hover:bg-[#093d31] flex items-center justify-center transition-all transform active:scale-90 duration-150"
        aria-label="زيادة"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
