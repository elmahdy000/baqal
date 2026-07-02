"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { productSchema } from "@/lib/validators";
import { createProduct, updateProduct } from "@/server/actions/store";
import { ImageUpload } from "@/components/store/image-upload";

type Category = { id: string; nameAr: string };

type FormValues = {
  name: string;
  nameAr?: string;
  description?: string;
  categoryId?: string | null;
  price: number;
  discountPrice?: number | null;
  stockQuantity: number;
  unit: "PIECE" | "KG" | "GRAM" | "LITER" | "ML" | "PACK" | "BOX" | "CARTON" | "DOZEN";
  imageUrl?: string | null;
  isAvailable: boolean;
  lowStockThreshold: number;
};

const UNITS: { value: FormValues["unit"]; label: string }[] = [
  { value: "PIECE", label: "قطعة" },
  { value: "KG", label: "كجم" },
  { value: "GRAM", label: "جرام" },
  { value: "LITER", label: "لتر" },
  { value: "ML", label: "ملل" },
  { value: "PACK", label: "باكيت" },
  { value: "BOX", label: "علبة" },
  { value: "CARTON", label: "كرتونة" },
  { value: "DOZEN", label: "دستة" },
];

export function ProductForm({
  categories,
  productId,
  initial,
}: {
  categories: Category[];
  productId?: string;
  initial?: Partial<FormValues>;
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
    resolver: zodResolver(productSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: initial?.name ?? "",
      nameAr: initial?.nameAr ?? "",
      description: initial?.description ?? "",
      categoryId: initial?.categoryId ?? undefined,
      price: initial?.price ?? 0,
      discountPrice: initial?.discountPrice ?? undefined,
      stockQuantity: initial?.stockQuantity ?? 0,
      unit: initial?.unit ?? "PIECE",
      imageUrl: initial?.imageUrl ?? undefined,
      isAvailable: initial?.isAvailable ?? true,
      lowStockThreshold: initial?.lowStockThreshold ?? 5,
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const payload = {
        ...values,
        categoryId: values.categoryId || null,
        discountPrice: values.discountPrice ?? null,
        imageUrl: values.imageUrl || null,
      };
      const res = productId
        ? await updateProduct(productId, payload)
        : await createProduct(payload);
      if (res && !res.ok) toast.error(res.error);
      else {
        toast.success(productId ? "تم التحديث" : "تم إضافة المنتج");
        router.push("/store/products");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nameAr">الاسم (عربي)</Label>
          <Input id="nameAr" {...register("nameAr")} />
          {errors.nameAr && (
            <p className="mt-1 text-xs text-red-600">{errors.nameAr.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="name">الاسم (إنجليزي)</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">الوصف</Label>
        <textarea
          id="description"
          {...register("description")}
          rows={3}
          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="categoryId">التصنيف</Label>
          <select
            id="categoryId"
            {...register("categoryId", {
              setValueAs: (v) => (v === "" || v == null ? undefined : v),
            })}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
          >
            <option value="">— اختر —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameAr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="unit">الوحدة</Label>
          <select
            id="unit"
            {...register("unit")}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="stockQuantity">الكمية بالمخزون</Label>
          <Input
            id="stockQuantity"
            type="number"
            min={0}
            {...register("stockQuantity")}
          />
          {errors.stockQuantity && (
            <p className="mt-1 text-xs text-red-600">{errors.stockQuantity.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="price">السعر (ج.م)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min={0}
            {...register("price")}
          />
          {errors.price && (
            <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="discountPrice">سعر الخصم (اختياري)</Label>
          <Input
            id="discountPrice"
            type="number"
            step="0.01"
            min={0}
            {...register("discountPrice", {
              setValueAs: (v) =>
                v === "" || v == null ? undefined : Number(v),
            })}
          />
        </div>
        <div>
          <Label htmlFor="lowStockThreshold">حد المخزون المنخفض</Label>
          <Input
            id="lowStockThreshold"
            type="number"
            min={0}
            {...register("lowStockThreshold")}
          />
        </div>
      </div>

      <div>
        <input
          type="hidden"
          {...register("imageUrl", {
            setValueAs: (v) => (v === "" || v == null ? undefined : v),
          })}
        />
        <ImageUpload
          value={watch("imageUrl") ?? ""}
          onChange={(url) =>
            setValue("imageUrl", url || undefined, { shouldValidate: true })
          }
          folder="products"
          label="صورة المنتج"
        />
        {errors.imageUrl && (
          <p className="mt-1 text-xs text-red-600">{errors.imageUrl.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          {...register("isAvailable")}
          className="h-4 w-4 rounded border-gray-300"
        />
        متاح للبيع
      </label>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "جاري الحفظ..." : productId ? "حفظ التعديلات" : "إضافة المنتج"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/store/products")}
          disabled={pending}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
}
