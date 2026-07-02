"use client";

import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { getProfile, setProfile, clearCart, type Profile } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BottomNav } from "@/components/customer/bottom-nav";
import { User, Heart, ChevronLeft, LogIn, LogOut } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

function ProfileContent() {
  const [profile, setLocal] = useState<Profile>({});
  const [loaded, setLoaded] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeSlug = searchParams.get("store") || "";

  useEffect(() => {
    setLocal(getProfile());
    setLoaded(true);
  }, []);

  function handleSave() {
    setProfile(profile);
    toast.success("تم حفظ البيانات بنجاح");
  }

  function handleLogout() {
    setProfile({});
    clearCart();
    toast.success("تم تسجيل الخروج");
    const loginUrl = storeSlug ? `/login?store=${storeSlug}` : "/login";
    router.push(loginUrl);
  }

  if (!loaded) {
    return <div className="p-6 text-center text-gray-500">جاري التحميل...</div>;
  }

  const isGuest = !profile.phone;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24" dir="rtl">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-black text-gray-900">حسابي</h1>
        {!isGuest && (
          <button
            onClick={handleLogout}
            className="text-xs text-red-500 hover:text-red-650 font-bold flex items-center gap-1 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        )}
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto">
        {isGuest ? (
          /* Guest User Welcome Card */
          <Card className="border-[#bfeade] bg-[#f0faf7]/40 animate-in fade-in duration-200 rounded-2xl">
            <CardContent className="flex flex-col items-center text-center p-6 space-y-3">
              <div className="h-14 w-14 rounded-xl bg-[#e6f4f1] flex items-center justify-center text-[#0c4a3b] shadow-sm">
                <User className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-gray-900 text-base">أهلاً بك في بقال!</h3>
                <p className="text-xs text-slate-400 font-bold max-w-[280px]">
                  سجل دخولك برقم الهاتف لحفظ سجل طلباتك، العناوين المفضلة، والمشتريات السريعة.
                </p>
              </div>
              <Button
                onClick={() => {
                  const url = storeSlug ? `/login?store=${storeSlug}` : "/login";
                  router.push(url);
                }}
                className="w-full font-black bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl shadow-lg shadow-green-600/10 py-3.5 h-auto text-sm border-0"
              >
                <LogIn className="h-4 w-4" />
                تسجيل الدخول / استعادة البيانات
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Authenticated User Status Card */
          <Card className="border-slate-100 rounded-2xl shadow-sm animate-in fade-in duration-200">
            <CardContent className="flex items-center gap-3 py-4 px-4">
              <div className="h-14 w-14 rounded-xl bg-[#e6f4f1] flex items-center justify-center shrink-0 text-[#0c4a3b] shadow-sm">
                <User className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-gray-900 text-base">{profile.name}</div>
                <div className="text-xs text-gray-400 font-bold font-mono mt-0.5">{profile.phone}</div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-[#e6f4f1] text-[#0a5c48] shadow-sm">
                حساب نشط
              </span>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Link
              href={storeSlug ? `/favorites?store=${storeSlug}` : "/favorites"}
              className="flex items-center gap-3 p-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-gray-900 text-sm">سلة البيت</div>
                <div className="text-xs text-gray-400 font-bold">منتجاتك المفضلة</div>
              </div>
              <ChevronLeft className="h-5 w-5 text-gray-400 shrink-0" />
            </Link>
          </CardContent>
        </Card>

        {!isGuest && (
          <Card className="border-slate-100 rounded-2xl shadow-sm animate-in slide-in-from-bottom-2 duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold text-gray-800">تعديل بياناتي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-gray-500">الاسم</Label>
                <Input
                  id="name"
                  value={profile.name ?? ""}
                  onChange={(e) =>
                    setLocal((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="اسمك بالكامل"
                  className="border-gray-250 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-gray-500">رقم الموبايل</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={profile.phone ?? ""}
                  onChange={(e) =>
                    setLocal((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="01xxxxxxxxx"
                  disabled
                  className="border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed font-mono rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="floor" className="text-xs font-bold text-gray-500">الطابق</Label>
                  <Input
                    id="floor"
                    value={profile.floor ?? ""}
                    onChange={(e) =>
                      setLocal((p) => ({ ...p, floor: e.target.value }))
                    }
                    placeholder="3"
                    className="border-gray-250 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apartment" className="text-xs font-bold text-gray-500">رقم الشقة</Label>
                  <Input
                    id="apartment"
                    value={profile.apartment ?? ""}
                    onChange={(e) =>
                      setLocal((p) => ({ ...p, apartment: e.target.value }))
                    }
                    placeholder="12"
                    className="border-gray-250 rounded-xl font-bold"
                  />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full font-black bg-[#0c4a3b] hover:bg-[#093d31] text-white rounded-xl shadow-lg shadow-[#0c4a3b]/10 py-3.5 h-auto text-sm transition-all transform active:scale-95 duration-200">
                حفظ التعديلات
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-[10px] text-center text-gray-400 font-medium">
          البيانات مشفرة ومحفوظة محلياً على جهازك لتوفير أقصى درجات الخصوصية
        </p>
      </main>

      <BottomNav storeSlug={storeSlug} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">جاري التحميل...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
