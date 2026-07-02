"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlan } from "@/server/actions/admin";

type Values = {
  name: string;
  nameAr: string;
  priceMonthly: number;
  priceYearly: number;
  maxBuildings: number;
  maxProducts: number;
  maxStoreUsers: number;
  features: string;
  isActive: boolean;
};

export function PlanEditForm({ id, initial }: { id: string; initial: Values }) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm<Values>({ defaultValues: initial });

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await updatePlan(id, values);
      if (!res.ok) toast.error(res.error);
      else toast.success("تم حفظ الخطة");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="nameAr">الاسم (عربي)</Label>
        <Input id="nameAr" {...register("nameAr", { required: true })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="name">الاسم (إنجليزي)</Label>
        <Input id="name" {...register("name", { required: true })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="priceMonthly">السعر الشهري (ج.م)</Label>
        <Input
          id="priceMonthly"
          type="number"
          step="0.01"
          min={0}
          {...register("priceMonthly", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="priceYearly">السعر السنوي (ج.م)</Label>
        <Input
          id="priceYearly"
          type="number"
          step="0.01"
          min={0}
          {...register("priceYearly", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="maxBuildings">أقصى عدد عمارات</Label>
        <Input
          id="maxBuildings"
          type="number"
          min={0}
          {...register("maxBuildings", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="maxProducts">أقصى عدد منتجات</Label>
        <Input
          id="maxProducts"
          type="number"
          min={0}
          {...register("maxProducts", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="maxStoreUsers">أقصى عدد مستخدمين</Label>
        <Input
          id="maxStoreUsers"
          type="number"
          min={0}
          {...register("maxStoreUsers", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="features">المزايا (مفصولة بفواصل)</Label>
        <Input
          id="features"
          placeholder="analytics, priority_support, custom_domain"
          {...register("features")}
        />
      </div>
      <div className="flex items-center gap-2 md:col-span-2">
        <input
          id="isActive"
          type="checkbox"
          {...register("isActive")}
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <Label htmlFor="isActive">مفعّلة</Label>
      </div>
      <div className="md:col-span-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </div>
    </form>
  );
}
