import { requireAdmin } from "@/lib/rbac";
import { getPlatformReport } from "@/server/queries/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEGP } from "@/lib/utils";
import { RevenuePerStoreChart } from "@/components/admin/reports/revenue-per-store-chart";
import { PlatformOrdersChart } from "@/components/admin/reports/platform-orders-chart";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdmin();
  const report = await getPlatformReport();

  if (report.orders.allTime === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
          <p className="text-sm text-gray-500">إحصائيات المنصة</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <div className="text-lg font-semibold text-gray-800">
              لسه مفيش داتا تكفي لعرض التقارير
            </div>
            <div className="text-sm text-gray-500">
              بعد أول طلبات هتشوف الرسم البياني هنا
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primary = [
    { label: "إجمالي الإيرادات", value: formatEGP(report.totalRevenue) },
    { label: "إجمالي الطلبات", value: report.orders.allTime.toString() },
    { label: "طلبات آخر ٣٠ يوم", value: report.orders.month.toString() },
    { label: "الإيراد الشهري المتكرر (MRR)", value: formatEGP(report.mrr) },
  ];

  const secondary = [
    { label: "اشتراكات نشطة", value: report.subscriptions.active.toString() },
    { label: "اشتراكات تجريبية", value: report.subscriptions.trial.toString() },
    { label: "اشتراكات متأخرة", value: report.subscriptions.pastDue.toString() },
    { label: "اشتراكات ملغية", value: report.subscriptions.cancelled.toString() },
    { label: "بقالات نشطة", value: report.stores.active.toString() },
    { label: "بقالات موقوفة", value: report.stores.suspended.toString() },
    { label: "إجمالي مسحات QR", value: report.totalScans.toString() },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
        <p className="text-sm text-gray-500">إحصائيات المنصة</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primary.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-1 p-5">
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className="text-2xl font-bold text-green-700">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {secondary.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الطلبات والإيرادات خلال آخر ١٤ يوم</CardTitle>
        </CardHeader>
        <CardContent>
          <PlatformOrdersChart data={report.dailyOrders} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أعلى ١٠ بقالات من حيث الإيرادات</CardTitle>
        </CardHeader>
        <CardContent>
          {report.revenuePerStore.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">لا توجد بيانات كافية</div>
          ) : (
            <RevenuePerStoreChart data={report.revenuePerStore} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الطلبات حسب المنطقة (٣٠ يوم)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">المنطقة</th>
                    <th className="px-4 py-3 font-medium">عدد الطلبات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.ordersByArea.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                        لا توجد بيانات
                      </td>
                    </tr>
                  ) : (
                    report.ordersByArea.map((a, idx) => (
                      <tr key={a.areaId ?? `none-${idx}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                        <td className="px-4 py-3 text-gray-900">{a.orderCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أعلى ١٠ عمارات من حيث المسحات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">العمارة</th>
                    <th className="px-4 py-3 font-medium">عدد المسحات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.topBuildings.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                        لا توجد بيانات
                      </td>
                    </tr>
                  ) : (
                    report.topBuildings.map((b) => (
                      <tr key={b.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                        <td className="px-4 py-3 text-gray-900">{b.scanCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
