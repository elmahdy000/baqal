"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { customerLogin } from "@/server/actions/customer";
import { setProfile, saveOrderId, type Profile } from "@/lib/cart";
import { Store, User, Phone, Lock, Mail, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [activeTab, setActiveTab] = useState<"customer" | "merchant">("customer");
  
  // Merchant State
  const [merchantLoading, setMerchantLoading] = useState(false);

  // Customer State
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [existingCustomerName, setExistingCustomerName] = useState("");
  const [customerLoading, setCustomerLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "name" | "confirm">("phone");
  const [resolvedStoreSlug, setResolvedStoreSlug] = useState("baraka");

  // Get store slug from query params if available
  useEffect(() => {
    const storeParam = params.get("store") || params.get("slug");
    if (storeParam) {
      setResolvedStoreSlug(storeParam);
    }
  }, [params]);

  // Handle Merchant Login
  async function onMerchantSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMerchantLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const res = await signIn("credentials", { email, password, redirect: false });
    setMerchantLoading(false);

    if (!res || res.error) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    toast.success("تم تسجيل الدخول بنجاح");
    
    // Fetch session role and route
    const s = await fetch("/api/auth/session").then((r) => r.json());
    const role = s?.user?.role;
    const callback = params.get("callbackUrl");
    
    if (callback) router.replace(callback);
    else if (role === "SUPER_ADMIN") router.replace("/admin");
    else router.replace("/store");
    router.refresh();
  }

  // Handle Customer Phone Submission (First Step)
  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || phone.length < 9) {
      toast.error("برجاء إدخال رقم موبايل صحيح");
      return;
    }
    setCustomerLoading(true);

    try {
      const res = await customerLogin(phone, undefined, resolvedStoreSlug);
      setCustomerLoading(false);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      if (res.isNew) {
        setIsNewCustomer(true);
        setStep("name");
      } else {
        setIsNewCustomer(false);
        setExistingCustomerName(res.customer.name);
        setStep("confirm");
      }
    } catch {
      setCustomerLoading(false);
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    }
  }

  // Handle Customer Name Submission or Direct Login Confirmation
  async function handleCustomerLoginFinal(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (isNewCustomer && !customerName.trim()) {
      toast.error("برجاء إدخال اسمك بالكامل");
      return;
    }
    setCustomerLoading(true);

    try {
      const res = await customerLogin(phone, isNewCustomer ? customerName : undefined, resolvedStoreSlug);
      setCustomerLoading(false);

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      if (!res.isNew) {
        // 1. Sync profile details locally
        const finalProfile: Profile = {
          name: res.customer.name,
          phone: res.customer.phone,
        };

        // If addresses exist, grab the default/first one
        if (res.addresses && res.addresses.length > 0) {
          const mainAddr = res.addresses[0];
          finalProfile.floor = mainAddr.floor ?? undefined;
          finalProfile.apartment = mainAddr.apartment ?? undefined;
        }
        setProfile(finalProfile);

        // 2. Sync order history locally
        if (res.orders && res.orders.length > 0) {
          res.orders.forEach((o) => {
            saveOrderId(o.id, o.token);
          });
        }

        toast.success(`أهلاً بك، ${res.customer.name}! تم استعادة بياناتك.`);
        
        // 3. Route to storefront with bcode context if it existed
        const bcode = params.get("bcode");
        const targetUrl = `/s/${res.customer.storeSlug}${bcode ? `?bcode=${bcode}` : ""}`;
        router.replace(targetUrl);
      }
    } catch {
      setCustomerLoading(false);
      toast.error("فشل تسجيل الدخول");
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gray-50 overflow-hidden" dir="rtl">
      {/* Decorative patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-green-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-green-500/5 blur-3xl" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-green-600 shadow-md shadow-green-600/10 flex items-center justify-center text-white text-3xl font-extrabold transform hover:rotate-12 transition-transform duration-300">
            ب
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">بقال</h1>
        </div>

        {/* Form Card */}
        <Card className="border-gray-200/80 shadow-xl shadow-gray-200/30 backdrop-blur-sm bg-white/95 overflow-hidden">
          <CardHeader className="p-0 border-b border-gray-100">
            {/* Custom Tab Switcher */}
            <div className="grid grid-cols-2 p-1 bg-gray-50 rounded-t-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("customer");
                  setStep("phone");
                  setPhone("");
                  setCustomerName("");
                }}
                className={`py-3 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "customer"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <User className="h-4 w-4" />
                دخول العميل
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("merchant")}
                className={`py-3 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "merchant"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Store className="h-4 w-4" />
                لوحة التحكم
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {activeTab === "customer" ? (
              /* CUSTOMER LOGIN FLOW */
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold mb-2">
                    <Sparkles className="h-3 w-3" />
                    دخول سريع وآمن برقم الموبايل
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">متابعة طلباتك ومفضلتك</h3>
                  <p className="text-xs text-gray-500 mt-1">سجل رقم هاتفك لاستعادة الطلبات السابقة والعناوين المحفوظة</p>
                </div>

                {step === "phone" && (
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer-phone" className="text-gray-700 font-semibold">رقم الموبايل</Label>
                      <div className="relative">
                        <Input
                          id="customer-phone"
                          type="tel"
                          inputMode="tel"
                          placeholder="01xxxxxxxxx"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="pr-10 text-right placeholder:text-right font-medium tracking-wide border-gray-200"
                        />
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full font-bold" size="lg" disabled={customerLoading}>
                      {customerLoading ? "جاري التحقق..." : "متابعة"}
                    </Button>
                  </form>
                )}

                {step === "name" && (
                  <form onSubmit={handleCustomerLoginFinal} className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-850 leading-normal">
                      رقم الموبايل <span className="font-semibold">{phone}</span> جديد. من فضلك اكتب اسمك لإنشاء حسابك المحفوظ.
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-name" className="text-gray-700 font-semibold">الاسم بالكامل</Label>
                      <Input
                        id="customer-name"
                        type="text"
                        placeholder="أحمد محمد"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="border-gray-200 font-semibold"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep("phone")}
                        disabled={customerLoading}
                        className="w-1/3"
                      >
                        رجوع
                      </Button>
                      <Button type="submit" className="w-2/3 font-bold" disabled={customerLoading}>
                        {customerLoading ? "جاري الإنشاء..." : "إنشاء حساب ودخول"}
                      </Button>
                    </div>
                  </form>
                )}

                {step === "confirm" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
                    <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50/50 border border-green-100 text-center">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                      <div className="text-sm text-gray-500">تم التعرف على الحساب</div>
                      <div className="text-lg font-bold text-gray-900">{existingCustomerName}</div>
                      <div className="text-xs text-gray-400 font-medium">{phone}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep("phone")}
                        disabled={customerLoading}
                        className="w-1/3"
                      >
                        تغيير الرقم
                      </Button>
                      <Button onClick={() => handleCustomerLoginFinal()} className="w-2/3 font-bold" disabled={customerLoading}>
                        {customerLoading ? "جاري التحميل..." : "تأكيد الدخول والاستمرار"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* MERCHANT LOGIN FORM */
              <form onSubmit={onMerchantSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className="pr-10 border-gray-200 font-medium"
                      placeholder="admin@baqal.app"
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-semibold">كلمة السر</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      className="pr-10 border-gray-200"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <Button className="w-full font-bold" size="lg" disabled={merchantLoading}>
                  {merchantLoading ? "جاري الدخول..." : "دخول"}
                </Button>

                <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
                  <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-green-600" />
                    حسابات تجريبية سريعة:
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-[11px] text-gray-600 leading-normal">
                    <div className="p-2 rounded bg-white border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-gray-700">مدير البقالة (Owner)</span>
                        <div className="text-gray-500 font-mono">store@baqal.app</div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-green-600 font-bold hover:bg-green-50"
                        onClick={() => {
                          const emailInput = document.getElementById("email") as HTMLInputElement;
                          const passInput = document.getElementById("password") as HTMLInputElement;
                          if (emailInput && passInput) {
                            emailInput.value = "store@baqal.app";
                            passInput.value = "store123456";
                          }
                        }}
                      >
                        نسخ تلقائي
                      </Button>
                    </div>
                    <div className="p-2 rounded bg-white border border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-gray-700">المدير العام (Admin)</span>
                        <div className="text-gray-500 font-mono">admin@baqal.app</div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-green-600 font-bold hover:bg-green-50"
                        onClick={() => {
                          const emailInput = document.getElementById("email") as HTMLInputElement;
                          const passInput = document.getElementById("password") as HTMLInputElement;
                          if (emailInput && passInput) {
                            emailInput.value = "admin@baqal.app";
                            passInput.value = "admin123456";
                          }
                        }}
                      >
                        نسخ تلقائي
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Back Link */}
        {activeTab === "customer" && (
          <div className="text-center">
            <button
              onClick={() => router.push(`/s/${resolvedStoreSlug}`)}
              className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-bold"
            >
              الرجوع للتصفح كزائر
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">جاري التحميل...</div>}>
      <LoginContent />
    </Suspense>
  );
}
