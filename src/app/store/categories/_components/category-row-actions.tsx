"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCategory } from "@/server/actions/store";
import { CategoryForm } from "./category-form";

type Cat = {
  id: string;
  nameAr: string;
  slug: string;
  icon: string | null;
  order: number;
};

export function CategoryRowActions({
  category,
  productCount,
}: {
  category: Cat;
  productCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    const msg =
      productCount > 0
        ? `في ${productCount} منتج مربوطين بالفئة دي. الحذف هيشيل الفئة من المنتجات. تأكيد؟`
        : "تأكيد حذف الفئة؟";
    if (!window.confirm(msg)) return;
    startTransition(async () => {
      const res = await deleteCategory(category.id);
      if (!res.ok) toast.error(res.error);
      else toast.success("تم الحذف");
    });
  };

  if (editing) {
    return (
      <div className="rounded-lg bg-gray-50 p-4">
        <CategoryForm
          categoryId={category.id}
          initial={{
            nameAr: category.nameAr,
            slug: category.slug,
            icon: category.icon ?? "",
            order: category.order,
          }}
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setEditing(true)}
        title="تعديل"
      >
        <Pencil className="h-3.5 w-3.5 me-1" />
        تعديل
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={onDelete}
        title="حذف"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
