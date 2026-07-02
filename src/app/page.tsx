"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Store,
  ShoppingCart,
  User,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  ShieldCheck,
  MapPin,
  Zap,
  ChevronDown,
  ChevronUp,
  Package,
  Bike,
  Building,
  ArrowLeftRight,
  PhoneCall,
  DollarSign,
  Minus,
  Plus,
  Bell,
  X,
  Menu,
  Check,
  QrCode,
  FileText,
  Award,
  Clock,
  Truck,
  XCircle,
  Eye,
  Info,
  Layers,
  ChevronLeft,
  Heart,
  Milk,
  Wheat,
  Droplets,
  Egg,
  Sun,
  Cpu,
  Flame
} from "lucide-react";

// Mock Products for the Simulator
const SIMULATOR_PRODUCTS = [
  { id: 1, name: "حليب كامل الدسم 1 لتر", price: 38, Icon: Milk, category: "ألبان" },
  { id: 2, name: "جبن فيتا عبور لاند 500 جرام", price: 42, Icon: Package, category: "ألبان" },
  { id: 3, name: "شيبسي عائلي ملح", price: 15, Icon: Cpu, category: "تسالي" },
  { id: 4, name: "طبق بيض أحمر طازج 30 بيضة", price: 155, Icon: Egg, category: "بيض" },
  { id: 5, name: "كرتونة مياه معدنية 1.5 لتر × 6", price: 48, Icon: Droplets, category: "مشروبات" },
  { id: 6, name: "زيت عباد شمس 1 لتر", price: 78, Icon: Sun, category: "بقالة" },
];

export default function LandingPage() {
  // Live Simulator State
  const [simulatorCart, setSimulatorCart] = useState<{ productId: number; quantity: number }[]>([]);
  const [simulatorStatus, setSimulatorStatus] = useState<"pending" | "preparing" | "delivering" | "done">("pending");
  const [simulatorNotification, setSimulatorNotification] = useState<string | null>(null);

  // FAQ State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add Product to Mock Cart
  const addToSimulatorCart = (productId: number) => {
    setSimulatorCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
    showNotification("تمت إضافة المنتج إلى سلة المشتريات!");
  };

  // Remove / Decrease Product
  const removeFromSimulatorCart = (productId: number) => {
    setSimulatorCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearSimulatorCart = () => {
    setSimulatorCart([]);
    setSimulatorStatus("pending");
  };

  const showNotification = (message: string) => {
    setSimulatorNotification(message);
    setTimeout(() => setSimulatorNotification(null), 3000);
  };

  const getCartTotal = () => {
    return simulatorCart.reduce((total, item) => {
      const prod = SIMULATOR_PRODUCTS.find((p) => p.id === item.productId);
      return total + (prod ? prod.price * item.quantity : 0);
    }, 0);
  };

  const getStatusLabel = () => {
    switch (simulatorStatus) {
      case "pending": return "تم إرسال الطلب";
      case "preparing": return "طلبك بيتجهز";
      case "delivering": return "الدليفري طالعلك";
      case "done": return "تم التوصيل";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 overflow-x-hidden selection:bg-[#16A34A] selection:text-white" dir="rtl">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-green-100/30 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] left-1/4 w-[450px] h-[450px] rounded-full bg-orange-100/20 blur-[110px] pointer-events-none -z-10" />
      <div className="absolute bottom-[1200px] right-10 w-[600px] h-[600px] rounded-full bg-green-50/40 blur-[150px] pointer-events-none -z-10" />

      {/* Grid Overlay */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none opacity-[0.015] -z-20"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* 9.1 Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-sm transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="relative h-9 w-9 flex items-center justify-center bg-gradient-to-br from-[#16A34A] to-[#15803D] rounded-xl shadow-md shadow-green-600/10 group-hover:scale-105 transition-transform duration-200">
                <span className="font-black text-white text-base">ب</span>
              </span>
              <div className="flex flex-col leading-none">
                <span className="font-black text-lg text-gray-900 tracking-tight">بقال</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-7 text-sm font-extrabold text-[#6B7280]">
              <a href="#how-it-works" className="hover:text-[#16A34A] transition-colors">طريقة العمل</a>
              <a href="#features" className="hover:text-[#16A34A] transition-colors">المميزات</a>
              <a href="#pricing" className="hover:text-[#16A34A] transition-colors">الأسعار</a>
              <a href="#faq" className="hover:text-[#16A34A] transition-colors">الأسئلة الشائعة</a>
              <a href="#contact" className="hover:text-[#16A34A] transition-colors">تواصل معنا</a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-extrabold text-[#6B7280] hover:text-gray-900 transition-colors px-3 py-2 rounded-xl"
            >
              تسجيل الدخول
            </Link>
            <Button
              asChild
              className="bg-[#16A34A] hover:bg-[#15803D] text-white font-black px-5 py-2.5 rounded-2xl shadow-md shadow-green-600/10 transition-all transform active:scale-95 duration-200"
            >
              <Link href="/login">ابدأ الآن</Link>
            </Button>

            {/* Mobile Hamburger Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200/80 px-4 py-4 space-y-3.5 shadow-inner">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-gray-700 hover:text-[#16A34A]"
            >
              طريقة العمل
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-gray-700 hover:text-[#16A34A]"
            >
              المميزات
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-gray-700 hover:text-[#16A34A]"
            >
              الأسعار
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-gray-700 hover:text-[#16A34A]"
            >
              الأسئلة الشائعة
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-gray-700 hover:text-[#16A34A]"
            >
              تواصل معنا
            </a>
          </div>
        )}
      </nav>

      {/* 9.2 Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left/Main content column (Right align in RTL) */}
            <div className="lg:col-span-6 space-y-6 text-right">
              <div className="inline-flex items-center gap-2 border border-green-200 bg-green-50/70 rounded-full px-4.5 py-1.5 text-xs font-black text-[#15803D] shadow-sm">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#F97316]" />
                <span>نظام طلبات البقالة والميني ماركت المتكامل</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.15] text-gray-900">
                حوّل بقال العمارة لمنصة
                <span className="block mt-2 bg-gradient-to-r from-[#16A34A] to-[#15803D] bg-clip-text text-transparent">
                  طلبات أونلاين في نفس اليوم
                </span>
              </h1>

              <p className="text-[#6B7280] text-sm sm:text-base leading-relaxed max-w-lg">
                بقال هو نظام ذكي للبقالين والميني ماركت. اطبع QR لكل عمارة، خلي السكان يطلبوا من الموبايل، واستقبل الطلبات لحظة بلحظة من لوحة تحكم واحدة.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  asChild
                  className="h-14 px-8 text-base bg-[#16A34A] hover:bg-[#15803D] text-white font-black rounded-2xl shadow-lg shadow-green-600/15 transition-all transform active:scale-95 duration-200"
                >
                  <Link href="/login">
                    ابدأ مع بقال
                    <ArrowRight className="h-4.5 w-4.5 mr-2 shrink-0" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-14 px-8 text-base border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-2xl font-bold"
                >
                  <a href="#how-it-works">شوف طريقة العمل</a>
                </Button>
              </div>

              {/* Trust Microcopy */}
              <div className="pt-6 border-t border-gray-100 flex items-center gap-3.5 flex-wrap text-xs text-[#6B7280] font-bold">
                <span className="flex items-center gap-1"><Check className="h-4 w-4 text-[#16A34A]" /> بدون تطبيق موبايل</span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1"><Check className="h-4 w-4 text-[#16A34A]" /> QR لكل عمارة</span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1"><Check className="h-4 w-4 text-[#16A34A]" /> طلبات Realtime</span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1"><Check className="h-4 w-4 text-[#16A34A]" /> PWA سريع</span>
              </div>
            </div>

            {/* Right Interactive Mockup Visual */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div className="relative w-full max-w-[480px] aspect-[4/3] rounded-2xl bg-slate-100/50 border border-slate-200/50 p-6 overflow-visible shadow-inner">
                
                {/* 1. Building Entrance QR Poster Preview */}
                <div className="absolute top-[-10px] right-[-20px] w-[140px] bg-white border border-gray-200 rounded-2xl shadow-lg p-3 z-10 animate-pulse-slow">
                  <div className="bg-[#DCFCE7] rounded-xl p-2.5 flex flex-col items-center text-center">
                    <QrCode className="h-8 w-8 text-[#16A34A] mb-1" />
                    <span className="text-[9px] font-black text-gray-900 block leading-tight">امسح واطلب</span>
                    <span className="text-[7px] text-[#6B7280] mt-0.5">بقال عمارة 4</span>
                  </div>
                  <div className="mt-2 text-center text-[7px] font-bold text-gray-500">
                    توصلك لحد باب الشقة
                  </div>
                </div>

                {/* 2. Mobile PWA Mockup */}
                <div className="absolute bottom-[-20px] right-[40px] w-[180px] bg-white border border-gray-250 rounded-3xl shadow-xl overflow-hidden z-20">
                  <div className="bg-[#16A34A] text-white px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-ping" />
                      <span className="text-[9px] font-black">بقال العمارة</span>
                    </div>
                    <ShoppingCart className="h-3 w-3 opacity-90" />
                  </div>
                  <div className="p-2 space-y-1.5 bg-gray-50 max-h-[140px] overflow-y-auto">
                    <div className="bg-white rounded-lg p-1.5 border border-gray-100 flex items-center justify-between text-[8px]">
                      <span className="font-bold flex items-center gap-1"><Milk className="h-3 w-3 text-blue-400" /> حليب كامل الدسم</span>
                      <span className="font-black text-[#16A34A] font-mono">38 ج.م</span>
                    </div>
                    <div className="bg-white rounded-lg p-1.5 border border-gray-100 flex items-center justify-between text-[8px]">
                      <span className="font-bold flex items-center gap-1"><Wheat className="h-3 w-3 text-amber-400" /> عيش بلدي طازج</span>
                      <span className="font-black text-[#16A34A] font-mono">15 ج.م</span>
                    </div>
                    <div className="bg-white rounded-lg p-1.5 border border-gray-100 flex items-center justify-between text-[8px]">
                      <span className="font-bold flex items-center gap-1"><Droplets className="h-3 w-3 text-sky-400" /> مياه معدنية 6 زجاجات</span>
                      <span className="font-black text-[#16A34A] font-mono">48 ج.م</span>
                    </div>
                  </div>
                  <div className="bg-white border-t border-gray-100 p-2 text-center">
                    <div className="bg-[#16A34A] text-white text-[8px] font-black py-1.5 rounded-xl">
                      تأكيد الطلب شقة 12
                    </div>
                  </div>
                </div>

                {/* 3. Dashboard Realtime Notification Card */}
                <div className="absolute top-[20px] left-[-10px] w-[200px] bg-white border border-gray-200 rounded-2xl shadow-xl p-3.5 z-30 transform -rotate-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-6 w-6 rounded-lg bg-orange-100 flex items-center justify-center text-[#F97316]">
                      <Bell className="h-3.5 w-3.5 animate-bounce" />
                    </div>
                    <span className="text-[10px] font-black text-gray-900">طلب جديد وصل!</span>
                  </div>
                  <div className="text-[9px] text-[#6B7280] font-bold">
                    مبنى 4 - شقة 12
                  </div>
                  <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-gray-100 text-[9px]">
                    <span className="font-black text-[#16A34A] font-mono">101 ج.م</span>
                    <div className="flex gap-1">
                      <span className="bg-[#DCFCE7] text-[#15803D] font-extrabold px-1.5 py-0.5 rounded text-[8px]">قبول</span>
                      <span className="bg-gray-100 text-gray-500 font-extrabold px-1.5 py-0.5 rounded text-[8px]">تجاهل</span>
                    </div>
                  </div>
                </div>

                {/* 4. Floating SaaS feature badges */}
                <div className="absolute bottom-[40px] left-[-30px] bg-white border border-gray-150 rounded-xl px-3 py-2 shadow-md flex items-center gap-1.5 text-[9px] font-extrabold text-gray-800 z-10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                  <span>إدارة مخزون</span>
                </div>

                <div className="absolute top-[130px] right-[-10px] bg-white border border-gray-150 rounded-xl px-3 py-2 shadow-md flex items-center gap-1.5 text-[9px] font-extrabold text-gray-800 z-10">
                  <Zap className="h-3.5 w-3.5 text-[#F97316]" />
                  <span>PWA بدون تحميل</span>
                </div>

                {/* Grid Background Mockup Backdrop */}
                <div className="w-full h-full border border-gray-200 bg-white rounded-xl shadow-lg flex items-center justify-center">
                  <div className="text-center opacity-30">
                    <Store className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                    <span className="text-xs font-bold text-gray-400">لوحة تحكم بقال</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9.3 Problem Section */}
      <section className="py-20 bg-white border-y border-gray-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-[#F97316]">العوائق اليومية</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              المشكلة مش إن البقال بعيد… المشكلة إنه مش أونلاين
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-base">
              طلبات السكان غالباً بتضيع بين المكالمات والواتساب، والبقال مش شايف الطلبات والمخزون والمبيعات في مكان واحد.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 max-w-5xl mx-auto">
            
            {/* Card 1 */}
            <div className="bg-[#F8FAFC] border border-gray-200/80 p-5 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-[#F97316]">
                <XCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-gray-900">طلبات بتضيع</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                الواتساب والمكالمات مش نظام واضح لإدارة الطلبات.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#F8FAFC] border border-gray-200/80 p-5 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-[#F97316]">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-gray-900">مفيش كتالوج</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                العميل مش عارف المنتجات المتاحة أو الأسعار.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#F8FAFC] border border-gray-200/80 p-5 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-[#F97316]">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-gray-900">المخزون مش واضح</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                صاحب البقالة مش شايف المنتجات اللي قربت تخلص.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#F8FAFC] border border-gray-200/80 p-5 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-[#F97316]">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-gray-900">مفيش تتبع</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                العميل يسأل كل شوية: الطلب وصل فين؟
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-[#F8FAFC] border border-gray-200/80 p-5 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-[#F97316]">
                <Building className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-gray-900">كل عمارة لوحدها</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                مفيش طريقة منظمة تربط كل عمارة بالبقال الخاص بها.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 9.4 Solution Section */}
      <section className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">الحل الذكي</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              بقال بيحوّل كل عمارة لنقطة طلب مباشرة
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-base">
              كل عمارة ليها QR خاص. السكان يمسحوا الكود، يفتحوا صفحة البقال، يطلبوا المنتجات، والبقال يستقبل الطلب فوراً.
            </p>
          </div>

          {/* 3-Step Visual Flow */}
          <div className="relative max-w-4xl mx-auto">
            {/* Connecting line */}
            <div className="absolute top-12 left-1/6 right-1/6 h-0.5 bg-gray-200 -z-10 hidden md:block" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-white border-2 border-green-500 flex items-center justify-center text-[#16A34A] shadow-md transform hover:rotate-6 transition">
                  <QrCode className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-black text-gray-900 text-lg">1. اطبع QR للعمارة</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed max-w-xs">
                    كل عمارة أو مدخل له كود خاص يفتح بقال العمارة مباشرة.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-white border-2 border-[#F97316] flex items-center justify-center text-[#F97316] shadow-md transform hover:-translate-y-1 transition">
                  <ShoppingCart className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-black text-gray-900 text-lg">2. السكان يمسحوا ويطلبوا</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed max-w-xs">
                    العميل يفتح PWA من المتصفح، يختار المنتجات، ويكتب رقم الشقة.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-white border-2 border-green-500 flex items-center justify-center text-[#16A34A] shadow-md transform hover:-rotate-6 transition">
                  <Store className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-black text-gray-900 text-lg">3. البقال يستقبل وينفذ</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed max-w-xs">
                    الطلب يظهر لحظة بلحظة على لوحة التحكم مع إشعار واضح.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 9.5 How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-gray-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#F97316]">خطوات التشغيل</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              طريقة العمل بسيطة
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-base">
              من أول إنشاء حساب البقال لحد أول طلب من سكان العمارة.
            </p>
          </div>

          {/* Steps Grid — 3 columns × 2 rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto mb-12">
            {[
              { num: "١", Icon: User,         title: "ننشئ حساب للبقال",      desc: "فتح حساب متجر وإضافة البيانات الأساسية والصورة." },
              { num: "٢", Icon: Package,      title: "نضيف المنتجات والأسعار", desc: "رفع الصور، تحديد الأسعار، الوحدات، والكميات." },
              { num: "٣", Icon: Building,     title: "نربط العمارات",          desc: "تخصيص وربط العمارات السكنية بالمتجر بسهولة." },
              { num: "٤", Icon: QrCode,       title: "نطبع QR لكل عمارة",     desc: "توليد الكود الملصق للمداخل والمصاعد." },
              { num: "٥", Icon: ShoppingCart, title: "السكان يطلبوا",          desc: "مسح سريع والطلب من المتصفح بدون تثبيت تطبيق." },
              { num: "٦", Icon: Bell,         title: "البقال يستقبل وينفّذ",   desc: "تنبيهات فورية Realtime وتنفيذ سريع للطلب." },
            ].map(({ num, Icon, title, desc }, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-6 text-right flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Top row: step badge + icon */}
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-[#16A34A]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black text-green-200 leading-none">{num}</span>
                </div>
                {/* Text */}
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-sm text-gray-900 leading-snug">{title}</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              asChild
              className="bg-[#16A34A] hover:bg-[#15803D] text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-green-600/10"
            >
              <Link href="/login">ابدأ بأول عمارة</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 9.6 Features Section */}
      <section id="features" className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">المميزات الأساسية</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              كل اللي محتاجه البقال في لوحة واحدة
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-base">
              طلبات، منتجات، مخزون، QR، عملاء، وتقارير من مكان واحد.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            
            {/* Feature 1 */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-100">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">إدارة المنتجات</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                أضف المنتجات، الصور، الأسعار، الوحدات، والعروض بسهولة.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-100">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">إدارة المخزون</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                تابع الكميات، المنتجات الناقصة، وحركات الدخول والخروج.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-100">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">طلبات Realtime</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                أي طلب جديد يظهر فوراً للبقال بدون تحديث الصفحة.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-100">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">QR لكل عمارة</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                كل عمارة لها رابط وكود مستقل يفتح صفحة الطلب الخاصة بها.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-100">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">PWA بدون تحميل</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                العميل يطلب من المتصفح ويقدر يضيف التطبيق على الشاشة.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-100">
                <Store className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">نقطة بيع داخل المحل</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                سجل بيع مباشر من المحل وخصم الكمية من المخزون تلقائياً.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-100">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">تقارير ومبيعات</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                اعرف مبيعات اليوم، عدد الطلبات، وأكثر المنتجات طلباً.
              </p>
            </div>

            {/* Feature 8 */}
            <div className="bg-white border border-gray-200 p-6 rounded-2xl text-right space-y-3 shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#16A34A] border border-green-100">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">تسويات وعمولات</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                تابع مستحقات المنصة والاشتراكات والعمولات بوضوح.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Simulator: Demo Area */}
      <section id="simulator" className="py-20 bg-white border-y border-gray-200/60 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-[#F97316]">تجربة تفاعلية حية</span>
            <h2 className="text-3xl sm:text-[40px] font-black text-gray-900">جرّب بقال بنفسك الآن!</h2>
            <p className="text-[#6B7280] text-sm sm:text-base max-w-xl mx-auto">
              اضغط على المنتجات في تطبيق العميل (على اليمين)، وشاهد كيف تظهر الطلبات وتتحكم بها من شاشة البقال (على اليسار) في ثوانٍ.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
            
            {/* 1. Customer Mock App (Right side) */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-[500px]">
                
                {/* Mobile Header Bar */}
                <div className="bg-white px-5 py-4 border-b border-gray-150 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-ping shrink-0" />
                    <span className="text-[11px] font-extrabold text-gray-800">بقال العمارة (طلب من مبنى 4)</span>
                  </div>
                  <div className="relative">
                    <ShoppingCart className="h-4.5 w-4.5 text-gray-600" />
                    {simulatorCart.length > 0 && (
                      <span className="absolute -top-2.5 -right-2.5 h-5 w-5 bg-[#16A34A] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                        {simulatorCart.reduce((acc, curr) => acc + curr.quantity, 0)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Products Area */}
                <div className="p-4 flex-1 overflow-y-auto space-y-4 max-h-[350px] bg-slate-50/50">
                  <div className="grid grid-cols-2 gap-3">
                    {SIMULATOR_PRODUCTS.map((prod) => (
                      <div key={prod.id} className="bg-white border border-gray-150 rounded-xl p-3 flex flex-col justify-between hover:border-green-300 transition shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="h-8 w-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-[#16A34A]">
                            <prod.Icon className="h-4 w-4" />
                          </div>
                          <span className="text-[9px] bg-gray-100 text-gray-650 px-2 py-0.5 rounded-full font-bold">
                            {prod.category}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-gray-800 mt-2 line-clamp-1">{prod.name}</h4>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                          <span className="text-xs font-black text-[#16A34A] font-mono">{prod.price} ج.م</span>
                          <button
                            onClick={() => addToSimulatorCart(prod.id)}
                            className="bg-green-50 hover:bg-green-100 text-[#16A34A] rounded-lg p-1.5 transition text-[10px] font-bold border border-green-100"
                          >
                            أضف +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cart & Checkout */}
                <div className="bg-white border-t border-gray-200 p-4 space-y-3 mt-auto">
                  {simulatorCart.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">سلة المشتريات فارغة، أضف بعض المنتجات.</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="max-h-[80px] overflow-y-auto space-y-1.5 pr-1">
                        {simulatorCart.map((item) => {
                          const prod = SIMULATOR_PRODUCTS.find((p) => p.id === item.productId);
                          if (!prod) return null;
                          return (
                            <div key={item.productId} className="flex justify-between items-center text-xs text-gray-700">
                              <span className="truncate font-bold">{prod.name} × {item.quantity}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-black text-gray-900">{prod.price * item.quantity} ج.م</span>
                                <button
                                  onClick={() => removeFromSimulatorCart(item.productId)}
                                  className="text-red-500 hover:text-red-700 font-extrabold text-xs"
                                >
                                  حذف
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-150">
                        <span className="text-xs font-bold text-gray-900">إجمالي قيمة السلة:</span>
                        <span className="text-sm font-black text-[#16A34A] font-mono">{getCartTotal()} ج.م</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1.5">
                        <button
                          onClick={clearSimulatorCart}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs py-2.5 rounded-xl font-bold transition"
                        >
                          تفريغ
                        </button>
                        <button
                          onClick={() => {
                            setSimulatorStatus("pending");
                            showNotification("تم إرسال طلبك للبقالة بنجاح!");
                          }}
                          className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs py-2.5 rounded-xl font-black transition"
                        >
                          تأكيد وإرسال الطلب
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* 2. Merchant Dashboard Mock (Left side) */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-[500px]">
                
                {/* Header */}
                <div className="bg-white px-5 py-4 border-b border-gray-150 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-[#16A34A]" />
                    <span className="text-xs font-black text-gray-900">شاشة البقال (لوحة التحكم)</span>
                  </div>
                  <span className="text-[10px] bg-green-50 text-[#16A34A] font-black px-2 py-0.5 rounded-full border border-green-100">
                    نشط فوراً
                  </span>
                </div>

                {/* Dashboard simulation panel */}
                <div className="p-5 flex-1 flex flex-col justify-between bg-slate-50/50">
                  {simulatorCart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-10">
                      <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-300">
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-600">في انتظار طلب جديد...</h4>
                        <p className="text-[10px] text-gray-400 mt-1">تظهر الطلبات هنا فور إرسال العميل لها من هاتفه</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      {/* Order Ticket */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] text-[#6B7280] font-black uppercase tracking-wider">الطلب النشط حالياً</span>
                            <h4 className="font-black text-sm text-gray-900 mt-0.5">طلب #28741</h4>
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-md ${
                            simulatorStatus === "pending" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                            simulatorStatus === "preparing" ? "bg-blue-50 text-blue-600 border border-blue-200" :
                            simulatorStatus === "delivering" ? "bg-orange-50 text-[#F97316] border border-orange-200" :
                            "bg-green-50 text-green-600 border border-green-200"
                          }`}>
                            {getStatusLabel()}
                          </span>
                        </div>

                        {/* Order Address & Total */}
                        <div className="space-y-1.5 text-xs border-y border-gray-100 py-3 text-gray-600">
                          <div className="flex justify-between">
                            <span>العنوان:</span>
                            <span className="font-bold text-gray-900">مبنى 4 · شقة 12</span>
                          </div>
                          <div className="flex justify-between">
                            <span>طريقة الدفع:</span>
                            <span className="font-bold text-gray-900">كاش عند الاستلام</span>
                          </div>
                          <div className="flex justify-between pt-1 font-extrabold text-gray-900">
                            <span>إجمالي الحساب:</span>
                            <span className="font-mono text-[#16A34A]">{getCartTotal()} ج.م</span>
                          </div>
                        </div>

                        {/* Status Controls */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-[#6B7280] block font-black">تحديث حالة الطلب الساكن:</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => {
                                setSimulatorStatus("preparing");
                                showNotification("تم تحديث الحالة: طلبك بيتجهز!");
                              }}
                              className={`text-[10px] py-2 font-black rounded-lg transition border ${
                                simulatorStatus === "preparing" ? "bg-blue-50 text-blue-600 border-blue-300" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              تجهيز الطلب
                            </button>
                            <button
                              onClick={() => {
                                setSimulatorStatus("delivering");
                                showNotification("تم تحديث الحالة: الدليفري طالعلك!");
                              }}
                              className={`text-[10px] py-2 font-black rounded-lg transition border ${
                                simulatorStatus === "delivering" ? "bg-orange-50 text-[#F97316] border-orange-300" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              الدليفري طالعلك
                            </button>
                            <button
                              onClick={() => {
                                setSimulatorStatus("done");
                                showNotification("تم تحديث الحالة: تم التوصيل بنجاح!");
                              }}
                              className={`text-[10px] py-2 font-black rounded-lg transition border ${
                                simulatorStatus === "done" ? "bg-green-50 text-green-600 border-green-300" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              تم التوصيل
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Timeline status update preview */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                        <span className="text-[10px] text-[#6B7280] font-black block">مسار الطلب عند العميل:</span>
                        <div className="flex items-center justify-between text-center relative px-2">
                          <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-100 -z-10" />
                          <div className="absolute top-3 right-6 h-0.5 bg-[#16A34A] -z-10 transition-all duration-300" style={{
                            width: simulatorStatus === "pending" ? "0%" :
                                   simulatorStatus === "preparing" ? "33%" :
                                   simulatorStatus === "delivering" ? "66%" : "100%"
                          }} />
                          
                          <div className="space-y-1">
                            <div className={`h-6 w-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-black ${simulatorStatus !== "pending" || simulatorStatus === "pending" ? "bg-[#16A34A] text-white" : "bg-gray-100 text-gray-400"}`}>1</div>
                            <span className="text-[8px] text-gray-600 font-bold">تم الإرسال</span>
                          </div>
                          <div className="space-y-1">
                            <div className={`h-6 w-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-black ${["preparing", "delivering", "done"].includes(simulatorStatus) ? "bg-[#16A34A] text-white" : "bg-gray-100 text-gray-400"}`}>2</div>
                            <span className="text-[8px] text-gray-600 font-bold">بيتجهز</span>
                          </div>
                          <div className="space-y-1">
                            <div className={`h-6 w-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-black ${["delivering", "done"].includes(simulatorStatus) ? "bg-[#16A34A] text-white" : "bg-gray-100 text-gray-400"}`}>3</div>
                            <span className="text-[8px] text-gray-600 font-bold">بالطريق</span>
                          </div>
                          <div className="space-y-1">
                            <div className={`h-6 w-6 mx-auto rounded-full flex items-center justify-center text-[10px] font-black ${simulatorStatus === "done" ? "bg-[#16A34A] text-white" : "bg-gray-100 text-gray-400"}`}>4</div>
                            <span className="text-[8px] text-gray-600 font-bold">التوصيل</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

          {/* Toast Notification */}
          {simulatorNotification && (
            <div className="fixed bottom-6 left-6 z-50 bg-[#16A34A] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 font-black text-xs border border-green-500 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <Sparkles className="h-4 w-4 shrink-0 text-[#F97316]" />
              <span>{simulatorNotification}</span>
            </div>
          )}
        </div>
      </section>

      {/* 9.7 Dashboard Mockup Section */}
      <section className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">لوحة التحكم</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              لوحة تحكم مصممة لشغل البقال اليومي
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-base">
              مش Dashboard معقدة. شاشة واضحة تقول لصاحب البقالة يعمل إيه دلوقتي.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm max-w-4xl mx-auto space-y-6">
            
            {/* Mock stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 text-right">
                <span className="text-[10px] text-[#6B7280] font-black block">طلبات اليوم</span>
                <span className="text-2xl font-black text-gray-900 block mt-1 font-mono">12</span>
              </div>
              <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 text-right">
                <span className="text-[10px] text-[#6B7280] font-black block">مبيعات اليوم</span>
                <span className="text-2xl font-black text-gray-900 block mt-1 font-mono">1,250 ج.م</span>
              </div>
              <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 text-right">
                <span className="text-[10px] text-[#6B7280] font-black block">طلبات في الانتظار</span>
                <span className="text-2xl font-black text-orange-500 block mt-1 font-mono">3</span>
              </div>
              <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 text-right">
                <span className="text-[10px] text-[#6B7280] font-black block">منتجات ناقصة</span>
                <span className="text-2xl font-black text-red-500 block mt-1 font-mono">5</span>
              </div>
            </div>

            {/* Mock pending order card */}
            <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-right">
              <div>
                <span className="bg-[#F97316] text-white text-[9px] font-black px-2 py-0.5 rounded-full">طلب جديد</span>
                <h4 className="font-extrabold text-sm text-gray-900 mt-2">مبنى 3 - شقة 14</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">منذ 3 دقائق • كاش عند الاستلام</p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <span className="font-mono font-black text-base text-gray-900">185 ج.م</span>
                <div className="flex gap-2">
                  <button className="bg-[#16A34A] text-white text-xs font-black px-4 py-2 rounded-xl shadow-sm">قبول الطلب</button>
                  <button className="bg-white border border-gray-200 text-gray-500 text-xs font-bold px-3 py-2 rounded-xl">رفض</button>
                </div>
              </div>
            </div>

            {/* Mock low stock alert */}
            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex items-center justify-between text-right">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <Package className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-gray-900">السكر قرب يخلص</h4>
                  <p className="text-[10px] text-red-500 font-bold mt-0.5">باقي 3 فقط</p>
                </div>
              </div>
              <span className="text-[10px] text-[#6B7280] font-black border border-gray-200 bg-white rounded-lg px-2.5 py-1">تعديل المخزون</span>
            </div>

          </div>
        </div>
      </section>

      {/* 9.8 Customer Experience Section */}
      <section className="py-20 bg-white border-b border-gray-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
            
            {/* Benefits info column */}
            <div className="lg:col-span-6 space-y-6 text-right order-last lg:order-first">
              <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">تجربة العميل</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                العميل يطلب في دقيقة
              </h2>
              <p className="text-[#6B7280] text-sm sm:text-base">
                بدون تحميل تطبيق. يمسح QR، يختار المنتجات، يكتب رقم الشقة، ويتابع حالة الطلب.
              </p>
              
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-[#16A34A] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">لا يحتاج تحميل تطبيق</h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">يفتح الموقع كصفحة PWA خفيفة وسريعة من المتصفح.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-[#16A34A] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">يحفظ بيانات الشقة</h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">يتم حفظ العنوان ورقم الهاتف تلقائياً للطلبات القادمة.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-[#16A34A] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">يكرر نفس الطلب</h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">إعادة طلب المستلزمات الشهرية أو الأسبوعية بضغطة واحدة.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-[#16A34A] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">يتابع حالة الطلب</h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">تتبع مسار التوصيل في زمن فعلي حتى وصول السائق للباب.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile PWA Mockup View column */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="bg-gray-100 border border-gray-250 rounded-3xl p-3 shadow-lg max-w-[280px] w-full">
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 flex flex-col h-[400px]">
                  
                  {/* Browser simulated bar */}
                  <div className="bg-gray-50 border-b border-gray-150 px-3 py-2 text-center text-[8px] text-gray-400 font-mono select-none">
                    baqal.app/s/al-barakah
                  </div>

                  {/* App Header */}
                  <div className="bg-[#16A34A] text-white px-3.5 py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black">بقال العمارة</h4>
                      <p className="text-[7px] opacity-75">مبنى 4 - توصيل مجاني</p>
                    </div>
                    <ShoppingCart className="h-4 w-4 opacity-90" />
                  </div>

                  {/* App Main Area */}
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-slate-50/50">
                    <div className="relative">
                      <input type="text" placeholder="ابحث عن منتج..." readOnly className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-[8px] outline-none text-right placeholder-gray-400" />
                    </div>
                    
                    <div>
                      <h5 className="text-[9px] font-black text-gray-900 mb-1.5">الأقسام المتاحة</h5>
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                        <span className="bg-[#DCFCE7] text-[#15803D] border border-green-200 px-2 py-0.5 rounded-full text-[7px] font-extrabold shrink-0">ألبان وجبن</span>
                        <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full text-[7px] font-bold shrink-0">مشروبات</span>
                        <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full text-[7px] font-bold shrink-0">بقالة جافة</span>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-[9px] font-black text-gray-900 mb-1.5">أحدث العروض</h5>
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-2 flex justify-between items-center">
                        <div className="text-right">
                          <span className="text-[8px] font-black text-gray-900">عرض نهاية الأسبوع</span>
                          <p className="text-[6px] text-gray-500 mt-0.5">طبق بيض + حليب بخصم 10%</p>
                        </div>
                        <span className="text-[9px] font-black text-[#F97316] font-mono">180 ج.م</span>
                      </div>
                    </div>
                  </div>

                  {/* App Bottom nav simulator */}
                  <div className="border-t border-gray-100 p-2 flex justify-between bg-white text-[8px] font-bold text-gray-500 select-none">
                    <span className="text-[#16A34A] flex flex-col items-center gap-0.5"><Store className="h-3 w-3" /> الرئيسية</span>
                    <span className="flex flex-col items-center gap-0.5"><ShoppingCart className="h-3 w-3" /> السلة</span>
                    <span className="flex flex-col items-center gap-0.5"><User className="h-3 w-3" /> حسابي</span>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9.9 QR Power Section */}
      <section className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
            
            {/* QR Poster Mockup Left */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-md max-w-[340px] w-full text-center space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-2xl p-5 flex flex-col items-center">
                  <QrCode className="h-16 w-16 text-[#16A34A] mb-3" />
                  <h4 className="font-black text-lg text-gray-900">امسح واطلب من بقال العمارة</h4>
                  <p className="text-xs text-[#6B7280] mt-1.5">طلبات بيتك توصلك لحد باب الشقة</p>
                </div>
                
                {/* Analytics overlay cards inside mockup */}
                <div className="grid grid-cols-2 gap-2 text-right">
                  <div className="bg-slate-50 border border-gray-150 rounded-xl p-2.5">
                    <span className="text-[8px] text-[#6B7280] font-black block">عدد مرات المسح</span>
                    <span className="text-xs font-black text-gray-900 mt-0.5 block font-mono">156 Scan</span>
                  </div>
                  <div className="bg-slate-50 border border-gray-150 rounded-xl p-2.5">
                    <span className="text-[8px] text-[#6B7280] font-black block">طلبات من العمارة</span>
                    <span className="text-xs font-black text-gray-900 mt-0.5 block font-mono">23 طلب</span>
                  </div>
                  <div className="bg-slate-50 border border-gray-150 rounded-xl p-2.5">
                    <span className="text-[8px] text-[#6B7280] font-black block">أكثر عمارة طلباً</span>
                    <span className="text-xs font-black text-gray-900 mt-0.5 block">مبنى 1</span>
                  </div>
                  <div className="bg-slate-50 border border-gray-150 rounded-xl p-2.5">
                    <span className="text-[8px] text-[#6B7280] font-black block">آخر طلب</span>
                    <span className="text-xs font-black text-gray-900 mt-0.5 block">منذ ساعتين</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Right */}
            <div className="lg:col-span-6 space-y-6 text-right">
              <span className="text-xs font-black uppercase tracking-widest text-[#F97316]">قوة الـ QR</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                QR صغير… يفتح سوق كامل للبقال
              </h2>
              <p className="text-[#6B7280] text-sm sm:text-base">
                بدل ما البقال يعتمد على المكالمات وجروبات الواتساب، كل عمارة تبقى قناة طلب مباشرة.
              </p>
              
              <div className="pt-2">
                <Button
                  asChild
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-green-600/10"
                >
                  <Link href="/login">اعمل QR لأول عمارة</Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9.10 Realtime Orders Section */}
      <section className="py-20 bg-white border-y border-gray-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
            
            {/* Content Left */}
            <div className="lg:col-span-6 space-y-6 text-right">
              <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">متابعة التوصيل</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                أي طلب جديد يظهر فوراً
              </h2>
              <p className="text-[#6B7280] text-sm sm:text-base">
                البقال يستقبل إشعار لحظي، يوافق على الطلب، يجهزه، والعميل يتابع الحالة خطوة بخطوة.
              </p>

              {/* Order Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  <span className="text-sm font-extrabold text-gray-800">تم إرسال الطلب</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  <span className="text-sm font-extrabold text-gray-800">البقال قبل الطلب</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                  <span className="text-sm font-extrabold text-gray-800">طلبك بيتجهز</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">الدليفري طالعلك</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">تم التوصيل</span>
                </div>
              </div>
            </div>

            {/* Realtime Notification Card Mockup Right */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="bg-slate-50 border border-gray-200 rounded-3xl p-5 shadow-sm max-w-[340px] w-full text-right space-y-4">
                
                {/* Realtime Notification Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden">
                  <span className="absolute top-0 left-0 h-1.5 w-full bg-[#16A34A]" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#16A34A] animate-pulse" />
                      <h4 className="font-black text-xs text-gray-900">طلب جديد وصل</h4>
                    </div>
                    <span className="text-[8px] text-gray-400 font-mono font-bold">الآن</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-gray-600 font-bold">
                    <div>أحمد - مبنى 4 - شقة 12</div>
                    <div className="text-gray-400">الإجمالي: <span className="font-mono text-gray-800 font-black">220 ج.م</span></div>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-gray-100">
                    <button className="flex-1 bg-[#16A34A] text-white text-[10px] font-black py-2 rounded-xl">قبول الطلب</button>
                    <button className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-2 rounded-xl">رفض</button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9.11 Inventory Section */}
      <section className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
            
            {/* Inventory UI Mockup Left */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm max-w-[340px] w-full text-right space-y-4">
                
                {/* Low Stock list */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] text-red-500 font-black uppercase">مخزون منخفض</h4>
                  <div className="bg-red-50/30 border border-red-100 rounded-xl p-3 flex justify-between items-center text-xs">
                    <span className="font-bold">شوكولاتة كتاكيت</span>
                    <span className="text-red-500 font-black font-mono">3 من 5</span>
                  </div>
                  <div className="bg-red-50/30 border border-red-100 rounded-xl p-3 flex justify-between items-center text-xs">
                    <span className="font-bold">لبن أطفال</span>
                    <span className="text-red-500 font-black font-mono">5 من 5</span>
                  </div>
                </div>

                {/* Out of Stock list */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] text-gray-400 font-black uppercase">نفد المخزون</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex justify-between items-center text-xs opacity-75">
                    <span className="font-bold text-gray-500">عسل نحل</span>
                    <span className="text-gray-400 font-bold font-mono">0 متبقي</span>
                  </div>
                </div>

                {/* Last Transactions */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <h4 className="text-[10px] text-gray-500 font-black">آخر حركات المخزون</h4>
                  <div className="flex justify-between items-center text-[10px] text-gray-600 font-bold">
                    <span>بيع مباشر #POS1024</span>
                    <span className="font-mono text-gray-800">قبل 57 ← بعد 56</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Content Right */}
            <div className="lg:col-span-6 space-y-6 text-right">
              <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">المستودع والمخازن</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                المخزون تحت السيطرة
              </h2>
              <p className="text-[#6B7280] text-sm sm:text-base">
                كل بيع أو طلب يخصم من المخزون تلقائياً، والتنبيهات تظهر قبل ما المنتج يخلص.
              </p>
              
              <div className="space-y-3 pt-2 text-xs text-gray-700 font-bold">
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> تنبيه مخزون منخفض</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> حركات مخزون واضحة</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> خصم تلقائي بعد البيع</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> تعديل يدوي عند الحاجة</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9.12 POS Section */}
      <section className="py-20 bg-white border-b border-gray-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
            
            {/* Content Left */}
            <div className="lg:col-span-6 space-y-6 text-right">
              <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">المبيعات المباشرة</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                بيع مباشر داخل المحل
              </h2>
              <p className="text-[#6B7280] text-sm sm:text-base">
                حتى البيع من داخل البقالة يتسجل على النظام ويخصم من المخزون.
              </p>

              <div className="space-y-3 pt-2 text-xs text-gray-750 font-bold">
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> بيع أسرع داخل المحل</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> خصم تلقائي من المخزون</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> تسجيل كل العمليات</div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> تقارير أدق للمبيعات</div>
              </div>
            </div>

            {/* POS Mockup Right */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="bg-slate-50 border border-gray-200 rounded-3xl p-5 shadow-sm max-w-[360px] w-full text-right space-y-3">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black border-b border-gray-100 pb-2">
                    <span>نقطة البيع (POS)</span>
                    <span className="text-gray-400 font-mono">الوردية #12</span>
                  </div>
                  
                  {/* Search bar */}
                  <input type="text" placeholder="بحث عن منتج بالاسم أو الباركود..." readOnly className="w-full bg-slate-50 border border-gray-200 rounded-xl px-2 py-1.5 text-[9px] text-right" />
                  
                  {/* Item List */}
                  <div className="space-y-1.5 max-h-[80px] overflow-y-auto text-[9px] font-bold text-gray-600">
                    <div className="flex justify-between">
                      <span>حليب كامل الدسم × 1</span>
                      <span className="font-mono">38 ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span>طبق بيض طازج × 1</span>
                      <span className="font-mono">155.00 ج.م</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-between items-center border-t border-gray-150 pt-2 text-[10px] font-black text-gray-900">
                    <span>الإجمالي:</span>
                    <span className="font-mono text-[#16A34A]">193 ج.م</span>
                  </div>

                  <button className="w-full bg-[#16A34A] text-white text-[10px] font-black py-2 rounded-xl">تأكيد البيع</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9.13 For Store Owners Section & 9.14 For Residents */}
      <section className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            
            {/* Store Owners */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 text-right space-y-5 shadow-sm">
              <div className="inline-flex items-center gap-2 bg-green-50 text-[#16A34A] font-black text-xs px-3 py-1 rounded-full border border-green-100">
                <Store className="h-4 w-4 shrink-0" />
                <span>لأصحاب المحلات</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900">مصمم للبقال الحقيقي… مش لشركات الدليفري</h3>
              <p className="text-[#6B7280] text-sm leading-relaxed">
                بقال معمول للبقال اللي عايز ينظم شغله، يستقبل طلبات من العمارات القريبة، ويتابع المخزون والمبيعات من غير تعقيد.
              </p>
              
              <div className="space-y-3 pt-1 text-xs text-gray-700 font-bold">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-gray-900">سهل الاستخدام</span>
                    <span className="block text-[11px] text-gray-500 font-normal mt-0.5">مش محتاج موظف تقني.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-gray-900">مناسب للمحل الصغير</span>
                    <span className="block text-[11px] text-gray-500 font-normal mt-0.5">ابدأ بعدد عمارات قليل وكبر تدريجياً.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-gray-900">يركز على المنطقة القريبة</span>
                    <span className="block text-[11px] text-gray-500 font-normal mt-0.5">العمارات القريبة هي مصدر الطلبات الأساسي.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Residents */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 text-right space-y-5 shadow-sm">
              <div className="inline-flex items-center gap-2 bg-orange-50 text-[#F97316] font-black text-xs px-3 py-1 rounded-full border border-orange-100">
                <User className="h-4 w-4 shrink-0" />
                <span>للسكان والعملاء</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900">السكان يطلبوا من بقال العمارة بسهولة</h3>
              <p className="text-[#6B7280] text-sm leading-relaxed">
                العميل مش محتاج يدور على محل أو يحمل تطبيق. يمسح QR الموجود في العمارة ويطلب مباشرة.
              </p>

              <div className="space-y-3 pt-1 text-xs text-gray-700 font-bold">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#F97316] shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-gray-900">طلب سريع</span>
                    <span className="block text-[11px] text-gray-500 font-normal mt-0.5">بدون تحميل تطبيق.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#F97316] shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-gray-900">توصيل لباب الشقة</span>
                    <span className="block text-[11px] text-gray-500 font-normal mt-0.5">تحديد رقم الشقة ورقم الدور بوضوح.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#F97316] shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-gray-900">تتبع حالة الطلب</span>
                    <span className="block text-[11px] text-gray-500 font-normal mt-0.5">متابعة مسار التوصيل في زمن فعلي.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9.15 Out-of-the-Box Features Section */}
      <section className="py-20 bg-white border-b border-gray-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">المميزات الفريدة</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              أفكار تخلي بقال أقوى من مجرد تطبيق طلبات
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-base">
              ميزات مصممة خصيصاً لتعزيز العلاقات وتسهيل التعامل اليومي مع السكان.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                Icon: Clock,
                color: "bg-orange-50 border-orange-100 text-orange-500",
                title: "اطلب نفس الطلب تاني",
                desc: "العميل يكرر طلب البيت المعتاد بضغطة واحدة بدون إعادة الاختيار.",
              },
              {
                Icon: Heart,
                color: "bg-rose-50 border-rose-100 text-rose-500",
                title: "سلة البيت",
                desc: "قائمة مفضلة بمنتجات البيت المتكررة جاهزة في أي وقت.",
              },
              {
                Icon: FileText,
                color: "bg-blue-50 border-blue-100 text-blue-500",
                title: "مش لاقي المنتج؟",
                desc: "العميل يكتب اللي محتاجه والبقال يرد عليه مباشرةً.",
              },
              {
                Icon: Flame,
                color: "bg-amber-50 border-amber-100 text-amber-500",
                title: "عروض آخر اليوم",
                desc: "البقال يفعّل عروض سريعة لتصريف المنتجات قبل نهاية اليوم.",
              },
              {
                Icon: DollarSign,
                color: "bg-green-50 border-green-100 text-[#16A34A]",
                title: "دفتر البيت",
                desc: "دعم الدفع الآجل أو التسوية الشهرية مع سكان العمارة.",
              },
              {
                Icon: Sparkles,
                color: "bg-purple-50 border-purple-100 text-purple-500",
                title: "بدائل ذكية",
                desc: "لو المنتج غير متاح، تظهر بدائل مناسبة تلقائياً للعميل.",
              },
            ].map(({ Icon, color, title, desc }, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-6 text-right flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`h-11 w-11 rounded-xl border flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-base text-gray-900">{title}</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9.16 Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">خطط الأسعار</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              باقات تناسب كل بقال
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-base">
              ابدأ صغير، واربط عمارات أكثر مع نمو الطلبات.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch mb-8">
            
            {/* Plan 1 */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 text-right flex flex-col justify-between shadow-sm relative">
              <div className="space-y-4">
                <h3 className="text-lg font-black text-[#6B7280]">Basic</h3>
                <p className="text-xs text-gray-400">للبقال الصغير</p>
                <div className="border-t border-gray-100 pt-4 space-y-3 text-xs text-gray-600 font-bold">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> 3 عمارات</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> 300 منتج</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> طلبات أونلاين</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> QR لكل عمارة</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> تقارير أساسية</div>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="mt-8 w-full border-gray-250 hover:bg-gray-50 text-gray-700 font-extrabold rounded-xl"
              >
                <Link href="/login">ابدأ Basic</Link>
              </Button>
            </div>

            {/* Plan 2: Recommended */}
            <div className="bg-white border-2 border-[#16A34A] rounded-3xl p-6 text-right flex flex-col justify-between shadow-md relative transform md:-translate-y-2">
              <span className="absolute top-[-14px] left-6 bg-[#16A34A] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                الأكثر مناسبة
              </span>
              <div className="space-y-4">
                <h3 className="text-lg font-black text-[#16A34A]">Plus</h3>
                <p className="text-xs text-gray-400">للبقال النشط</p>
                <div className="border-t border-gray-100 pt-4 space-y-3 text-xs text-gray-600 font-bold">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> 15 عمارة</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> 1000 منتج</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> إشعارات Realtime</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> عروض وتصنيف</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> تقارير أفضل</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> دعم العملاء</div>
                </div>
              </div>
              <Button
                asChild
                className="mt-8 w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-black rounded-xl shadow-md shadow-green-600/10"
              >
                <Link href="/login">ابدأ Plus</Link>
              </Button>
            </div>

            {/* Plan 3 */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 text-right flex flex-col justify-between shadow-sm relative">
              <div className="space-y-4">
                <h3 className="text-lg font-black text-[#6B7280]">Pro</h3>
                <p className="text-xs text-gray-400">للميني ماركت</p>
                <div className="border-t border-gray-100 pt-4 space-y-3 text-xs text-gray-600 font-bold">
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> عمارات غير محدودة</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> منتجات غير محدودة</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> نقطة بيع (POS)</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> مخزون متقدم</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> تقارير متقدمة</div>
                  <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#16A34A]" /> سائقين وتسويات</div>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="mt-8 w-full border-gray-250 hover:bg-gray-50 text-gray-700 font-extrabold rounded-xl"
              >
                <Link href="/login">ابدأ Pro</Link>
              </Button>
            </div>

          </div>

          <p className="text-center text-xs text-[#6B7280] font-bold mt-6">
            الأسعار حسب حجم البقالة وعدد العمارات. تواصل معنا لتحديد الباقة المناسبة.
          </p>
        </div>
      </section>

      {/* 9.17 Onboarding Section */}
      <section className="py-20 bg-white border-b border-gray-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">التشغيل والبداية</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              مش هنسيب البقال يضيع في إدخال المنتجات
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-base">
              أكبر تحدي في نجاح النظام هو التشغيل، لذلك بقال يدعم تجهيز البداية بالكامل.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-10">
            
            {/* Onboarding card 1 */}
            <div className="bg-[#F8FAFC] border border-gray-200/80 p-5 rounded-2xl text-right space-y-2">
              <h3 className="font-extrabold text-sm text-gray-900">إدخال أول المنتجات</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">نساعد في تجهيز الكتالوج الأساسي.</p>
            </div>

            {/* Onboarding card 2 */}
            <div className="bg-[#F8FAFC] border border-gray-200/80 p-5 rounded-2xl text-right space-y-2">
              <h3 className="font-extrabold text-sm text-gray-900">تصوير المنتجات</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">صور واضحة للمنتجات المهمة.</p>
            </div>

            {/* Onboarding card 3 */}
            <div className="bg-[#F8FAFC] border border-gray-200/80 p-5 rounded-2xl text-right space-y-2">
              <h3 className="font-extrabold text-sm text-gray-900">طباعة QR</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">تصميم وطباعة QR لكل عمارة.</p>
            </div>

            {/* Onboarding card 4 */}
            <div className="bg-[#F8FAFC] border border-gray-200/80 p-5 rounded-2xl text-right space-y-2">
              <h3 className="font-extrabold text-sm text-gray-900">تدريب سريع</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">شرح بسيط للبقال على استقبال الطلبات وتنفيذها.</p>
            </div>

          </div>

          <div className="text-center">
            <Button
              asChild
              className="bg-[#16A34A] hover:bg-[#15803D] text-white font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-green-600/10"
            >
              <Link href="/login">جهّز أول بقالة</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 9.18 Trust Section */}
      <section className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
            
            {/* Content Left */}
            <div className="lg:col-span-6 space-y-6 text-right">
              <span className="text-xs font-black uppercase tracking-widest text-[#F97316]">الانتشار والملاءمة</span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                مبني على احتياج حقيقي في السوق المحلي
              </h2>
              
              <div className="space-y-3 pt-2 text-sm text-gray-800 font-bold">
                <div className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-[#16A34A]" /> مناسب للبقالين تحت العمارات</div>
                <div className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-[#16A34A]" /> مناسب للكومباوندات والمجمعات</div>
                <div className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-[#16A34A]" /> مناسب للميني ماركت والهايبر المحلي</div>
                <div className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-[#16A34A]" /> يدعم الطلبات السريعة والمتكررة</div>
                <div className="flex items-center gap-2.5"><Check className="h-4.5 w-4.5 text-[#16A34A]" /> يقلل الاعتماد على المكالمات والواتساب</div>
              </div>
            </div>

            {/* Neighborhood graphic Right */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <div className="bg-white border border-gray-250 rounded-3xl p-6 shadow-sm w-full max-w-[360px] text-center space-y-4">
                <div className="relative h-[200px] w-full bg-slate-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                  
                  {/* Central Store */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md z-10">
                    <Store className="h-6 w-6" />
                  </div>
                  
                  {/* Surrounding Buildings connected */}
                  <div className="absolute top-5 left-10 h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="absolute bottom-5 left-8 h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="absolute top-6 right-8 h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="absolute bottom-8 right-12 h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    <Building className="h-5 w-5" />
                  </div>

                  {/* Connection lines visual */}
                  <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <line x1="30%" y1="20%" x2="50%" y2="50%" stroke="green" strokeWidth="2" strokeDasharray="4" />
                    <line x1="25%" y1="80%" x2="50%" y2="50%" stroke="green" strokeWidth="2" strokeDasharray="4" />
                    <line x1="80%" y1="25%" x2="50%" y2="50%" stroke="green" strokeWidth="2" strokeDasharray="4" />
                    <line x1="75%" y1="75%" x2="50%" y2="50%" stroke="green" strokeWidth="2" strokeDasharray="4" />
                  </svg>
                </div>
                <div className="text-[10px] text-[#6B7280] font-bold">كل العمارات متصلة ببقالة واحدة مركزية لتسريع التوصيل</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9.19 FAQ Section */}
      <section id="faq" className="py-20 bg-white border-y border-gray-200/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">إجابات سريعة</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">الأسئلة الشائعة</h2>
            <p className="text-sm text-[#6B7280]">كل ما تحتاج لمعرفته عن منصة بقال وعملية التشغيل.</p>
          </div>

          <div className="space-y-3.5">
            {[
              {
                q: "هل العميل لازم يحمل تطبيق؟",
                a: "لا. العميل يمسح QR ويفتح الطلب من المتصفح مباشرة، ويقدر يضيفه على الشاشة كـ PWA."
              },
              {
                q: "هل كل عمارة لها QR مختلف؟",
                a: "نعم. كل عمارة لها كود ورابط مستقل، وده يساعد في تتبع الطلبات وعدد مرات المسح."
              },
              {
                q: "هل البقال يقدر يدير المخزون؟",
                a: "نعم. كل طلب أو بيع مباشر يخصم من المخزون، والتنبيهات تظهر عند انخفاض الكمية."
              },
              {
                q: "هل ينفع أبدأ ببقالة واحدة؟",
                a: "نعم. ابدأ ببقالة واحدة وعدد بسيط من العمارات، وبعدها توسع تدريجياً."
              },
              {
                q: "هل المنصة مناسبة للميني ماركت؟",
                a: "نعم. المنصة مناسبة للبقالة الصغيرة والميني ماركت والمتاجر داخل الكومباوندات."
              },
              {
                q: "هل إضافة العمارات تتم من البقال؟",
                a: "إضافة وربط العمارات يمكن إدارتها من لوحة المسؤول العام، والبقال يقدر يشوف الأكواد ويحمل QR الخاص بكل عمارة."
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-right font-black text-gray-900 text-sm sm:text-base hover:bg-slate-100/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="h-4.5 w-4.5 text-[#16A34A] shrink-0" /> : <ChevronDown className="h-4.5 w-4.5 text-gray-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#6B7280] leading-relaxed border-t border-gray-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9.20 Final CTA Section */}
      <section id="contact" className="py-20 md:py-28 bg-[#DCFCE7] text-gray-900 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/30 blur-[130px] pointer-events-none -z-10" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-[48px] font-black tracking-tight leading-tight">
            خلي بقالتك تستقبل طلبات أونلاين من النهارده
          </h2>
          <p className="text-sm sm:text-base max-w-xl mx-auto font-bold text-gray-700 leading-relaxed">
            ابدأ بحساب بقال واحد، اربط أول عمارة، واطبع أول QR.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button
              asChild
              className="h-14 px-8 text-base bg-[#16A34A] hover:bg-[#15803D] text-white font-black rounded-2xl shadow-xl transition-all"
            >
              <Link href="/login">ابدأ الآن</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-14 px-8 text-base border-gray-250 text-gray-700 bg-white hover:bg-gray-50 rounded-2xl font-bold"
            >
              <Link href="https://wa.me/201000000000" target="_blank">تواصل معنا</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 9.21 Footer */}
      <footer className="bg-white border-t border-gray-200 py-16 text-[#6B7280] text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 mb-12">
            
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 space-y-4 text-right">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="relative h-8 w-8 flex items-center justify-center bg-[#16A34A] rounded-lg shadow-sm">
                  <span className="font-black text-white text-xs">ب</span>
                </span>
                <span className="font-extrabold text-base text-gray-900">بقال</span>
              </Link>
              <p className="max-w-xs text-[11px] leading-relaxed">
                نظام ذكي لتحويل البقالة والميني ماركت لنظام طلبات أونلاين بالـ QR.
              </p>
            </div>

            {/* Product */}
            <div className="col-span-1 md:col-span-2 space-y-3 text-right">
              <h4 className="font-extrabold text-gray-900 uppercase">المنتج</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-gray-900 transition">المميزات</a></li>
                <li><a href="#how-it-works" className="hover:text-gray-900 transition">طريقة العمل</a></li>
                <li><a href="#pricing" className="hover:text-gray-900 transition">الأسعار</a></li>
                <li><span className="text-gray-400">PWA للعملاء</span></li>
                <li><span className="text-gray-400">QR للعمارات</span></li>
              </ul>
            </div>

            {/* Dashboard */}
            <div className="col-span-1 md:col-span-2 space-y-3 text-right">
              <h4 className="font-extrabold text-gray-900 uppercase">لوحة التحكم</h4>
              <ul className="space-y-2">
                <li><span className="text-gray-400">الطلبات</span></li>
                <li><span className="text-gray-400">المنتجات</span></li>
                <li><span className="text-gray-400">المخزون</span></li>
                <li><span className="text-gray-400">نقطة البيع</span></li>
                <li><span className="text-gray-400">التقارير</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-2 md:col-span-4 space-y-3.5 text-right">
              <h4 className="font-extrabold text-gray-900 uppercase">تواصل معنا</h4>
              <div className="flex items-center gap-2 text-[#16A34A] font-black">
                <PhoneCall className="h-4 w-4 shrink-0" />
                <span>دعم فني متاح 24 ساعة</span>
              </div>
              <p className="text-[11px]">تواصل معنا للاستفسار عن تفعيل الحسابات الكبرى أو الكومباوندات.</p>
            </div>

          </div>

          <div className="border-t border-gray-150 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 font-bold">
            <div>© 2026 Baqal. جميع الحقوق محفوظة.</div>
            <div className="flex gap-1.5 items-center">
              <span>صُنع بشغف لتطوير المتاجر المحلية</span>
              <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
