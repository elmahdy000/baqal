"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateSubscription } from "@/server/actions/admin";

type PlanOpt = { id: string; nameAr: string; tier: string };

type Values = {
  planId: string;
  status: "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  billingCycle: "MONTHLY" | "YEARLY";
  amount: number;
};

export function SubscriptionForm({
  storeId,
  plans,
  initial,
}: {
  storeId: string;
  plans: PlanOpt[];
  initial: Values;
}) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm<Values>({ defaultValues: initial });

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await updateSubscription(storeId, values);
      if (!res.ok) toast.error(res.error);
      else toast.success("تم حفظ الاشتراك");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="planId">الخطة</Label>
        <select
          id="planId"
          {...register("planId")}
          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nameAr} ({p.tier})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="status">الحالة</Label>
        <select
          id="status"
          {...register("status")}
          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="TRIAL">تجريبي</option>
          <option value="ACTIVE">نشط</option>
          <option value="PAST_DUE">متأخر</option>
          <option value="CANCELLED">ملغي</option>
          <option value="EXPIRED">منتهي</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="billingCycle">دورة الفوترة</Label>
        <select
          id="billingCycle"
          {...register("billingCycle")}
          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="MONTHLY">شهري</option>
          <option value="YEARLY">سنوي</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="amount">المبلغ (ج.م)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min={0}
          {...register("amount", { valueAsNumber: true })}
        />
      </div>
      <div className="md:col-span-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "جاري الحفظ..." : "حفظ الاشتراك"}
        </Button>
      </div>
    </form>
  );
}
