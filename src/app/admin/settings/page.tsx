import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-sm text-gray-500">إعدادات المنصة العامة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات المنصة</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            هذه الصفحة قيد التطوير. سنضيف قريباً إعدادات المنصة والعمولات
            والإشعارات.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
