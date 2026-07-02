import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Percent,
  Sliders,
  Mail,
  Shield,
  Save,
  Database,
  Volume2
} from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإعدادات العامة</h1>
          <p className="text-sm text-gray-500">إدارة تكوين المنصة والعمولات وقنوات الاتصال</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-2">
          <Save className="h-4 w-4" />
          <span>حفظ التغييرات</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Right Section: Core Configs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Commission settings */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">النسب والعمولات الافتراضية</CardTitle>
                <p className="text-xs text-gray-500">القيم الافتراضية التي تُطبق عند إنشاء بقالات جديدة.</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="default_commission">نسبة عمولة المنصة (%)</Label>
                  <div className="relative">
                    <Input id="default_commission" type="number" defaultValue="5" className="pl-8" />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">%</span>
                  </div>
                  <p className="text-[11px] text-gray-400">النسبة التي تقتطعها المنصة من كل طلب تم توصيله.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="trial_period">فترة التجربة الافتراضية (يوم)</Label>
                  <Input id="trial_period" type="number" defaultValue="14" />
                  <p className="text-[11px] text-gray-400">عدد الأيام المجانية للبقالات الجديدة عند التسجيل.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Contact & Support Settings */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">بيانات التواصل والدعم للمنصة</CardTitle>
                <p className="text-xs text-gray-500">البيانات التي تظهر للبقالات في صفحات الدعم والمساعدة.</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="support_email">بريد الدعم الفني</Label>
                  <Input id="support_email" type="email" defaultValue="support@baqal.app" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="support_phone">رقم الواتساب للاستفسارات</Label>
                  <Input id="support_phone" type="text" defaultValue="+201000000000" dir="ltr" className="text-right" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: System Features Switchers */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">خيارات التسجيل والقبول</CardTitle>
                <p className="text-xs text-gray-500">التحكم في تفعيل أو تعطيل مميزات المنصة العامة.</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <div className="text-sm font-semibold text-gray-800">قبول تسجيل بقالات جديدة</div>
                  <div className="text-xs text-gray-400">السماح لأصحاب البقالات بإنشاء حسابات جديدة ذاتياً.</div>
                </div>
                <Badge className="bg-green-500 text-white hover:bg-green-600">مفعّل</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <div className="text-sm font-semibold text-gray-800">التفعيل التلقائي للحسابات</div>
                  <div className="text-xs text-gray-400">تفعيل حساب البقالة مباشرة دون انتظار مراجعة الأدمن.</div>
                </div>
                <Badge className="bg-gray-200 text-gray-600 hover:bg-gray-300">معطل (يدوي)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-800">وضع الصيانة للمنصة</div>
                  <div className="text-xs text-gray-400">تحويل المنصة بالكامل لوضع الصيانة لجميع المستخدمين.</div>
                </div>
                <Badge className="bg-gray-200 text-gray-600 hover:bg-gray-300">معطل</Badge>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Left Section: Metadata & Diagnostics */}
        <div className="space-y-6">
          
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">معلومات النظام</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-gray-600 font-medium">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>اسم المنصة:</span>
                <span className="font-bold text-gray-800">بقال (Baqal)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>نسخة التطبيق:</span>
                <span className="font-mono text-gray-850">v2.1.0-prod</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>بيئة التشغيل:</span>
                <Badge tone="green" className="text-[10px] py-0">Production</Badge>
              </div>
              <div className="flex justify-between py-1">
                <span>حالة قاعدة البيانات:</span>
                <span className="text-green-600 font-bold">متصلة (OK)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">عمليات الصيانة والـ Sync</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start text-xs font-semibold gap-2 border-gray-200">
                <Volume2 className="h-4 w-4 text-gray-400" />
                <span>إرسال إشعار عام للبقالات</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs font-semibold gap-2 border-gray-200 text-amber-700 hover:bg-amber-50">
                <Database className="h-4 w-4 text-amber-500" />
                <span>إعادة فهرسة قاعدة البيانات</span>
              </Button>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
