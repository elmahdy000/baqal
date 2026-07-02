"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "./category-form";
import { CategoryRowActions } from "./category-row-actions";

type Cat = {
  id: string;
  nameAr: string;
  slug: string;
  icon: string | null;
  order: number;
  productCount: number;
};

export function CategoryPageBody({ categories }: { categories: Cat[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الفئات</h1>
          <p className="text-sm text-gray-500">
            نظّم منتجاتك في فئات علشان العميل يوصل بسرعة
          </p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}>فئة جديدة</Button>
        )}
      </div>

      {creating && (
        <Card>
          <CardContent className="p-4">
            <CategoryForm onDone={() => setCreating(false)} />
          </CardContent>
        </Card>
      )}

      {categories.length === 0 && !creating ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-gray-500">
            لسه مفيش فئات. ابدأ بإضافة فئة جديدة.
          </CardContent>
        </Card>
      ) : categories.length > 0 ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="text-right">
                  <th className="p-3 font-medium">الترتيب</th>
                  <th className="p-3 font-medium">الأيقونة</th>
                  <th className="p-3 font-medium">الاسم</th>
                  <th className="p-3 font-medium">المعرف</th>
                  <th className="p-3 font-medium">عدد المنتجات</th>
                  <th className="p-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 align-top">
                    <td className="p-3 text-gray-700">{c.order}</td>
                    <td className="p-3 text-xl">{c.icon || "—"}</td>
                    <td className="p-3 font-medium text-gray-900">
                      {c.nameAr}
                    </td>
                    <td className="p-3 text-gray-500" dir="ltr">
                      {c.slug}
                    </td>
                    <td className="p-3 text-gray-700">{c.productCount}</td>
                    <td className="p-3">
                      <CategoryRowActions
                        category={{
                          id: c.id,
                          nameAr: c.nameAr,
                          slug: c.slug,
                          icon: c.icon,
                          order: c.order,
                        }}
                        productCount={c.productCount}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
