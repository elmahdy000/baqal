"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatEGP } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { BottomNav } from "@/components/customer/bottom-nav";

function CartContent() {
  const [cart, api] = useCart();
  const sp = useSearchParams();
  const storeFromUrl = sp.get("store");
  const bcodeFromUrl = sp.get("bcode");

  const storeSlug = cart.storeSlug || storeFromUrl || "";
  const buildingCode = cart.buildingCode || bcodeFromUrl || undefined;

  const canCheckout = cart.items.length > 0 && !!storeSlug;

  return (
    <div className="min-h-screen bg-slate-50 pb-24" dir="rtl">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100/80 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          {storeSlug && (
            <Link
              href={`/s/${storeSlug}${buildingCode ? `?bcode=${buildingCode}` : ""}`}
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
          <h1 className="text-lg font-black text-slate-900">السلة</h1>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mb-5 shadow-sm border border-green-100">
              <ShoppingBag className="h-8 w-8 text-[#16A34A]" />
            </div>
            <h2 className="text-base font-black text-slate-900 mb-1">السلة فاضية</h2>
            <p className="text-xs text-slate-400 font-extrabold mb-6">ابدأ ضيف منتجات علشان تكمل الطلب</p>
            {storeSlug && (
              <Button asChild className="font-extrabold bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl shadow-lg shadow-green-600/10 px-8 py-3.5 h-auto border-0">
                <Link href={`/s/${storeSlug}${buildingCode ? `?bcode=${buildingCode}` : ""}`}>
                  ارجع للبقالة
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <Card key={item.productId} className="border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden">
                  <CardContent className="flex items-center gap-3 py-3.5 px-3.5">
                    <div className="h-16 w-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {item.snapshot.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.snapshot.imageUrl}
                          alt={item.snapshot.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-black text-slate-350">
                          {item.snapshot.name.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-slate-950 text-sm line-clamp-2 leading-snug">
                        {item.snapshot.name}
                      </h3>
                      {item.notes && (
                        <div className="text-xs text-orange-600 font-extrabold mt-1 bg-orange-50 border border-orange-100/60 rounded-lg px-2 py-0.5 w-fit">
                          {item.notes}
                        </div>
                      )}
                      <div className="text-[#16A34A] font-black text-sm mt-1 font-mono">
                        {formatEGP(item.snapshot.price * item.quantity)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <button
                        onClick={() => api.removeItem(item.productId, item.notes)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        aria-label="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
                        <button
                          onClick={() => api.setQty(item.productId, item.quantity - 1, item.notes)}
                          className="h-7 w-7 flex items-center justify-center hover:bg-[#ECFDF5] text-slate-500 hover:text-[#16A34A] rounded-lg transition-colors"
                          aria-label="نقص"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black w-6 text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => api.setQty(item.productId, item.quantity + 1, item.notes)}
                          className="h-7 w-7 flex items-center justify-center hover:bg-[#ECFDF5] text-slate-500 hover:text-[#16A34A] rounded-lg transition-colors"
                          aria-label="زيادة"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-slate-200/80 rounded-2xl shadow-sm bg-white">
              <CardContent className="space-y-2 py-4 px-4">
                <div className="flex justify-between text-sm font-extrabold text-slate-500">
                  <span>المجموع الفرعي</span>
                  <span className="text-slate-900 font-black font-mono">{formatEGP(api.subtotal)}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-extrabold">
                  التوصيل والإجمالي بيتحسبوا في خطوة الدفع
                </div>
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full font-black bg-[#16A34A] hover:bg-[#15803D] text-white rounded-2xl shadow-lg shadow-green-600/10 py-4 h-auto text-base transition-all transform active:scale-95 duration-200 border-0"
              disabled={!canCheckout}
              asChild
            >
              <Link href="/checkout">متابعة للدفع</Link>
            </Button>
          </>
        )}
      </main>

      <BottomNav storeSlug={storeSlug || undefined} />
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400 font-bold">جاري التحميل...</div>}>
      <CartContent />
    </Suspense>
  );
}
