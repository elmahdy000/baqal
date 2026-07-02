"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBuildingSchema } from "@/lib/validators";
import { createBuilding } from "@/server/actions/admin";
import { Plus, X } from "lucide-react";

type FormValues = z.infer<typeof createBuildingSchema>;

export function NewBuildingForm({
  stores,
}: {
  stores: { id: string; name: string; nameAr: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(createBuildingSchema) });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await createBuilding(values);
      if (res.ok) {
        toast.success("تم إنشاء العمارة");
        reset();
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        <span>عمارة جديدة</span>
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>عمارة جديدة</CardTitle>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="name">اسم العمارة</Label>
            <Input id="name" placeholder="عمارة 12" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="storeId">البقالة</Label>
            <select
              id="storeId"
              {...register("storeId")}
              className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <option value="">اختر بقالة</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr ?? s.name}
                </option>
              ))}
            </select>
            {errors.storeId && (
              <p className="text-xs text-red-600">{errors.storeId.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="street">الشارع</Label>
            <Input id="street" {...register("street")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="buildingNumber">رقم العمارة</Label>
            <Input id="buildingNumber" {...register("buildingNumber")} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="compoundName">اسم الكمبوند / المنطقة</Label>
            <Input id="compoundName" {...register("compoundName")} />
          </div>
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
