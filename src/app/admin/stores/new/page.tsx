"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStoreSchema } from "@/lib/validators";
import { createStore } from "@/server/actions/admin";

type FormValues = z.infer<typeof createStoreSchema>;

export default function NewStorePage() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createStoreSchema),
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await createStore(values);
      if (res && "ok" in res && !res.ok) {
        toast.error(res.error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "حصل خطأ";
      // NEXT_REDIRECT is expected on success — swallow it silently
      if (!msg.includes("NEXT_REDIRECT")) toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">بقالة جديدة</h1>
        <p className="text-sm text-gray-500">أنشئ حساب بقالة ومالك</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات البقالة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="name">اسم البقالة</Label>
                <Input id="name" placeholder="بقالة الحاج محمد" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" placeholder="haj-mohamed" {...register("slug")} />
                {errors.slug && (
                  <p className="text-xs text-red-600">{errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">الهاتف</Label>
                <Input id="phone" placeholder="01000000000" {...register("phone")} />
                {errors.phone && (
                  <p className="text-xs text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="mb-3 text-sm font-semibold text-gray-700">بيانات المالك</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="ownerName">اسم المالك</Label>
                  <Input id="ownerName" {...register("ownerName")} />
                  {errors.ownerName && (
                    <p className="text-xs text-red-600">{errors.ownerName.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ownerEmail">إيميل المالك</Label>
                  <Input id="ownerEmail" type="email" {...register("ownerEmail")} />
                  {errors.ownerEmail && (
                    <p className="text-xs text-red-600">{errors.ownerEmail.message}</p>
                  )}
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="ownerPassword">كلمة السر</Label>
                  <Input
                    id="ownerPassword"
                    type="password"
                    {...register("ownerPassword")}
                  />
                  {errors.ownerPassword && (
                    <p className="text-xs text-red-600">{errors.ownerPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "جاري الحفظ..." : "إنشاء البقالة"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
