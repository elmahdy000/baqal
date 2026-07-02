import { requireStore } from "@/lib/rbac";
import { getStoreReport } from "@/server/queries/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEGP } from "@/lib/utils";
import { SalesLineChart } from "@/components/store/reports/sales-line-chart";
import { TopProductsChart } from "@/components/store/reports/top-products-chart";

export const dynamic = "force-dynamic";

export default async function StoreReportsPage() {
  const user = await requireStore();
  const report = await getStoreReport(user.storeId);

  if (report.orders.totalEver === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
          <p className="text-sm text-gray-500">إحصائيات وتقارير البقالة</p>
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
    { label: "مبيعات اليوم", value: formatEGP(report.revenue.today), sub: `${report.orders.today} طلب` },
    { label: "مبيعات آخر ٧ أيام", value: formatEGP(report.revenue.week), sub: `${report.orders.week} طلب` },
    { label: "مبيعات آخر ٣٠ يوم", value: formatEGP(report.revenue.month), sub: `${report.orders.month} طلب` },
  ];

  const secondary = [
    { label: "متوسط قيمة الطلب (٣٠ يوم)", value: formatEGP(report.avgOrderValue) },
    { label: "طلبات ملغية (٣٠ يوم)", value: report.cancelledMonth.toString() },
    { label: "منتجات ذات مخزون منخفض", value: report.lowStockCount.toString() },
    { label: "إجمالي الطلبات", value: report.orders.totalEver.toString() },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
        <p className="text-sm text-gray-500">إحصائيات وتقارير البقالة</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {primary.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-1 p-5">
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className="text-2xl font-bold text-green-700">{s.value}</div>
              <div className="text-xs text-gray-500">{s.sub}</div>
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
          <CardTitle>المبيعات خلال آخر ١٤ يوم</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesLineChart data={report.salesByDay} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أعلى ١٠ منتجات مبيعاً (٣٠ يوم)</CardTitle>
        </CardHeader>
        <CardContent>
          {report.topProducts.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              لا توجد بيانات كافية
            </div>
          ) : (
            <TopProductsChart data={report.topProducts} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>أكثر العملاء نشاطاً (٣٠ يوم)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">الاسم</th>
                    <th className="px-4 py-3 font-medium">الهاتف</th>
                    <th className="px-4 py-3 font-medium">عدد الطلبات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.topCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                        لا توجد بيانات
                      </td>
                    </tr>
                  ) : (
                    report.topCustomers.map((c) => (
                      <tr key={c.customerId}>
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-gray-700">{c.phone}</td>
                        <td className="px-4 py-3 text-gray-900">{c.orderCount}</td>
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
            <CardTitle>الطلبات حسب العمارة (٣٠ يوم)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">العمارة</th>
                    <th className="px-4 py-3 font-medium">عدد الطلبات</th>
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
                      <tr key={b.buildingId}>
                        <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                        <td className="px-4 py-3 text-gray-900">{b.orderCount}</td>
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
