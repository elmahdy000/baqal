import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { storeStatusLabel, storeStatusTone } from "@/lib/labels";
import { toggleStoreStatus } from "@/server/actions/admin";
import { EmptyState } from "@/components/ui/empty";
import { Plus, Store } from "lucide-react";

export default async function AdminStoresPage() {
  const stores = await db.store.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { products: true, orders: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">البقالات</h1>
          <p className="text-sm text-gray-500">قائمة كل البقالات المسجلة</p>
        </div>
        <Link href="/admin/stores/new">
          <Button>
            <Plus className="h-4 w-4" />
            <span>بقالة جديدة</span>
          </Button>
        </Link>
      </div>

      {stores.length === 0 ? (
        <EmptyState
          icon={<Store className="h-6 w-6" />}
          title="لسه مفيش بقالات"
          description="أنشئ أول بقالة عشان تبدأ."
          action={
            <Link href="/admin/stores/new">
              <Button>
                <Plus className="h-4 w-4" />
                <span>أنشئ أول بقالة</span>
              </Button>
            </Link>
          }
        />
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>الكل ({stores.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الاسم</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">الهاتف</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">المنتجات</th>
                  <th className="px-4 py-3 font-medium">الطلبات</th>
                  <th className="px-4 py-3 font-medium">تاريخ الإنشاء</th>
                  <th className="px-4 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stores.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {s.nameAr ?? s.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{s.slug}</td>
                      <td className="px-4 py-3 text-gray-700">{s.phone ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge tone={storeStatusTone(s.status)}>
                          {storeStatusLabel(s.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{s._count.products}</td>
                      <td className="px-4 py-3 text-gray-700">{s._count.orders}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {s.createdAt.toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/stores/${s.id}`}
                            className="text-sm text-green-700 hover:underline"
                          >
                            تعديل
                          </Link>
                          <form
                            action={async () => {
                              "use server";
                              await toggleStoreStatus(s.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="text-sm text-gray-600 hover:underline"
                            >
                              {s.status === "ACTIVE" ? "إيقاف" : "تفعيل"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
