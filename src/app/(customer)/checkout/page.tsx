"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators";
import { placeOrder } from "@/server/actions/customer";
import { getProfile, setProfile, saveOrderId } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEGP } from "@/lib/utils";
import { BottomNav } from "@/components/customer/bottom-nav";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

export default function CheckoutPage() {
  const [cart, api] = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [storeMeta, setStoreMeta] = useState<{
    deliveryFee: number;
    minOrderAmount: number;
    isOpen: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema) as unknown as Resolver<CheckoutInput>,
    defaultValues: {
      storeSlug: "",
      buildingCode: undefined,
      customerName: "",
      customerPhone: "",
      floor: "",
      apartment: "",
      deliveryNotes: "",
      items: [],
      paymentMethod: "CASH_ON_DELIVERY",
    },
  });

  // Hydrate defaults from cart + localStorage profile
  useEffect(() => {
    if (!cart.storeSlug) return;
    setValue("storeSlug", cart.storeSlug);
    if (cart.buildingCode) setValue("buildingCode", cart.buildingCode);
    setValue(
      "items",
      cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, notes: i.notes }))
    );
    const profile = getProfile();
    if (profile.name) setValue("customerName", profile.name);
    if (profile.phone) setValue("customerPhone", profile.phone);
    if (profile.floor) setValue("floor", profile.floor);
    if (profile.apartment) setValue("apartment", profile.apartment);
  }, [cart, setValue]);

  // Fetch store meta for delivery fee & min order display
  useEffect(() => {
    if (!cart.storeSlug) return;
    fetch(`/api/customer/store/${cart.storeSlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setStoreMeta({
            deliveryFee: Number(data.deliveryFee),
            minOrderAmount: Number(data.minOrderAmount),
            isOpen: data.isOpen,
          });
        }
      })
      .catch(() => {});
  }, [cart.storeSlug]);

  const paymentMethod = watch("paymentMethod");

  const subtotal = api.subtotal;
  const deliveryFee = storeMeta?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;

  const belowMin =
    storeMeta && storeMeta.minOrderAmount > 0 && subtotal < storeMeta.minOrderAmount;

  const disabledReason = useMemo(() => {
    if (cart.items.length === 0) return "السلة فاضية";
    if (!cart.storeSlug) return "مفيش بقالة محددة";
    if (belowMin) return `أقل طلب ${formatEGP(storeMeta!.minOrderAmount)}`;
    return null;
  }, [cart, belowMin, storeMeta]);

  const onSubmit: SubmitHandler<CheckoutInput> = (values) => {
    setError(null);
    startTransition(async () => {
      const res = await placeOrder(values);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      // Save profile & orderId
      setProfile({
        name: values.customerName,
        phone: values.customerPhone,
        floor: values.floor,
        apartment: values.apartment,
      });
      saveOrderId(res.orderId, res.token);
      api.clearCart();
      toast.success("تم إرسال الطلب");
      router.push(`/orders/${res.orderId}?t=${encodeURIComponent(res.token)}`);
    });
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center bg-slate-50" dir="rtl">
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-sm w-full">
          <div className="h-16 w-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mb-5 shadow-sm border border-green-100">
            <ShoppingBag className="h-8 w-8 text-[#16A34A]" />
          </div>
          <h1 className="text-base font-black mb-2 text-slate-900">السلة فاضية</h1>
          <p className="text-xs text-slate-400 font-extrabold mb-6">ضيف منتجات الأول</p>
          <Button asChild className="bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold rounded-xl px-8 py-3.5 h-auto border-0 w-full">
            <Link href="/">الرئيسية</Link>
          </Button>
        </div>
        <BottomNav storeSlug={cart.storeSlug} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28" dir="rtl">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100/80 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/cart" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-black text-slate-900">إتمام الطلب</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 max-w-md mx-auto">
        <Card className="border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black text-slate-900">بيانات التواصل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="customerName" className="font-extrabold text-xs text-slate-500">الاسم</Label>
              <Input
                id="customerName"
                {...register("customerName")}
                placeholder="اسمك الكريم"
                className="rounded-xl mt-1 h-11 border-slate-200 focus-visible:ring-2 focus-visible:ring-green-100 focus-visible:border-[#16A34A]"
              />
              {errors.customerName && (
                <p className="text-xs text-red-500 font-extrabold mt-1">{errors.customerName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="customerPhone" className="font-extrabold text-xs text-slate-500">رقم الموبايل</Label>
              <Input
                id="customerPhone"
                type="tel"
                inputMode="tel"
                {...register("customerPhone")}
                placeholder="01xxxxxxxxx"
                className="rounded-xl mt-1 h-11 font-mono text-left border-slate-200 focus-visible:ring-2 focus-visible:ring-green-100 focus-visible:border-[#16A34A]"
                dir="ltr"
              />
              {errors.customerPhone && (
                <p className="text-xs text-red-500 font-extrabold mt-1">{errors.customerPhone.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black text-slate-900">عنوان التوصيل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="buildingCode" className="font-extrabold text-xs text-slate-500">كود العمارة</Label>
              <Input
                id="buildingCode"
                {...register("buildingCode")}
                readOnly={!!cart.buildingCode}
                placeholder="كود العمارة"
                className="rounded-xl mt-1 h-11 font-black bg-slate-50 text-slate-700 border-slate-200 focus-visible:ring-2 focus-visible:ring-green-100 focus-visible:border-[#16A34A]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="floor" className="font-extrabold text-xs text-slate-500">الطابق</Label>
                <Input
                  id="floor"
                  {...register("floor")}
                  placeholder="3"
                  className="rounded-xl mt-1 h-11 font-extrabold border-slate-200 focus-visible:ring-2 focus-visible:ring-green-100 focus-visible:border-[#16A34A]"
                />
              </div>
              <div>
                <Label htmlFor="apartment" className="font-extrabold text-xs text-slate-500">رقم الشقة</Label>
                <Input
                  id="apartment"
                  {...register("apartment")}
                  placeholder="12"
                  className="rounded-xl mt-1 h-11 font-extrabold border-slate-200 focus-visible:ring-2 focus-visible:ring-green-100 focus-visible:border-[#16A34A]"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="deliveryNotes" className="font-extrabold text-xs text-slate-500">ملاحظات (اختياري)</Label>
              <Input
                id="deliveryNotes"
                {...register("deliveryNotes")}
                placeholder="مثلًا: سيب الطلب عند الباب"
                className="rounded-xl mt-1 h-11 border-slate-200 focus-visible:ring-2 focus-visible:ring-green-100 focus-visible:border-[#16A34A]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black text-slate-900">طريقة الدفع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3.5 cursor-pointer has-[:checked]:border-[#16A34A] has-[:checked]:bg-[#ECFDF5] transition-all">
              <input
                type="radio"
                value="CASH_ON_DELIVERY"
                {...register("paymentMethod")}
                className="accent-[#16A34A] h-4 w-4"
              />
              <span className="font-extrabold text-sm text-slate-800">كاش عند الاستلام</span>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3.5 cursor-pointer has-[:checked]:border-[#16A34A] has-[:checked]:bg-[#ECFDF5] transition-all">
              <input
                type="radio"
                value="PAY_LATER"
                {...register("paymentMethod")}
                className="accent-[#16A34A] h-4 w-4"
              />
              <span className="font-extrabold text-sm text-slate-800">اطلب دلوقتي وادفع بعدين</span>
            </label>
            <p className="text-[10px] text-slate-400 font-extrabold px-1">
              {paymentMethod === "PAY_LATER"
                ? "هتقدر تدفع للبقال في أي وقت لاحق."
                : "الدفع كاش وقت استلام الطلب."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black text-slate-900">ملخص الطلب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2 max-h-40 overflow-auto no-scrollbar">
              {cart.items.map((it) => (
                <div key={`${it.productId}-${it.notes ?? ""}`} className="flex justify-between items-start text-slate-700 font-extrabold gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="line-clamp-1 text-xs">
                      {it.snapshot.name} × {it.quantity}
                    </span>
                    {it.notes && (
                      <span className="text-[9px] text-orange-600 bg-orange-50 border border-orange-100 rounded px-1.5 py-0.5 font-black mt-0.5 w-fit">
                        {it.notes}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-slate-900 font-black shrink-0 text-xs">
                    {formatEGP(it.snapshot.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="flex justify-between text-slate-500 font-extrabold text-xs">
                <span>المجموع الفرعي</span>
                <span className="font-mono">{formatEGP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-extrabold text-xs">
                <span>التوصيل</span>
                <span className="font-mono">{formatEGP(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-950 pt-2 border-t border-slate-100 text-base">
                <span>الإجمالي</span>
                <span className="font-mono text-[#15803D]">{formatEGP(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-xs font-extrabold px-3 py-2.5">
            {error}
          </div>
        )}

        {disabledReason && !isPending && (
          <div className="rounded-xl bg-yellow-50 border border-yellow-250 text-yellow-800 text-xs font-extrabold px-3 py-2.5">
            {disabledReason}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full font-black bg-[#16A34A] hover:bg-[#15803D] text-white rounded-2xl shadow-lg shadow-green-600/10 py-4 h-auto text-base transition-all transform active:scale-95 duration-200 border-0"
          disabled={isPending || !!disabledReason}
        >
          {isPending ? "جاري إرسال الطلب..." : `اطلب الآن — ${formatEGP(total)}`}
        </Button>
      </form>

      <BottomNav storeSlug={cart.storeSlug} />
    </div>
  );
}
