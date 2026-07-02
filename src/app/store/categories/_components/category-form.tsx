"use client";

import { useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { categorySchema } from "@/lib/validators";
import { createCategory, updateCategory } from "@/server/actions/store";
import { slugify } from "@/lib/utils";

type FormValues = {
  nameAr: string;
  slug: string;
  icon?: string | null;
  order: number;
};

export function CategoryForm({
  categoryId,
  initial,
  onDone,
}: {
  categoryId?: string;
  initial?: Partial<FormValues>;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(categorySchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      nameAr: initial?.nameAr ?? "",
      slug: initial?.slug ?? "",
      icon: initial?.icon ?? "",
      order: initial?.order ?? 0,
    },
  });

  const nameAr = watch("nameAr");
  const slug = watch("slug");

  // Auto-slugify from nameAr when the user hasn't manually typed a slug
  useEffect(() => {
    if (!categoryId && nameAr && !slug) {
      setValue("slug", slugify(nameAr));
    }
  }, [nameAr, slug, categoryId, setValue]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const payload = {
        ...values,
        icon: values.icon || null,
      };
      const res = categoryId
        ? await updateCategory(categoryId, payload)
        : await createCategory(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(categoryId ? "تم التحديث" : "تم إضافة الفئة");
      if (onDone) onDone();
      else router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cat-nameAr">اسم الفئة</Label>
          <Input id="cat-nameAr" {...register("nameAr")} placeholder="مشروبات" />
          {errors.nameAr && (
            <p className="mt-1 text-xs text-red-600">{errors.nameAr.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="cat-slug">المعرف (slug)</Label>
          <Input id="cat-slug" {...register("slug")} placeholder="drinks" dir="ltr" />
          {errors.slug && (
            <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cat-icon">الأيقونة (إيموجي)</Label>
          <Input id="cat-icon" {...register("icon")} placeholder="🥤" maxLength={4} />
        </div>
        <div>
          <Label htmlFor="cat-order">الترتيب</Label>
          <Input
            id="cat-order"
            type="number"
            min={0}
            {...register("order")}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "جاري الحفظ..." : categoryId ? "حفظ التعديلات" : "إضافة الفئة"}
        </Button>
        {onDone && (
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            disabled={pending}
          >
            إلغاء
          </Button>
        )}
      </div>
    </form>
  );
}
