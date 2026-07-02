"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  updateStoreCommissionRate,
  createSettlement,
} from "@/server/actions/admin";
import { formatEGP } from "@/lib/utils";

export function CommissionRateForm({
  storeId,
  initialRate,
}: {
  storeId: string;
  initialRate: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rate, setRate] = useState<number>(initialRate);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateStoreCommissionRate({ storeId, rate });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("تم تحديث نسبة العمولة");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="rate">نسبة العمولة (%)</Label>
        <Input
          id="rate"
          type="number"
          step="0.1"
          min={0}
          max={100}
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="w-32"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "جاري..." : "تحديث"}
      </Button>
    </form>
  );
}

export function CreateSettlementButton({
  storeId,
  totalOwed,
  ordersUnsettled,
}: {
  storeId: string;
  totalOwed: number;
  ordersUnsettled: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (
      !confirm(
        `سيتم إنشاء تسوية لـ ${ordersUnsettled} طلب بمبلغ ${formatEGP(totalOwed)}. هل تريد المتابعة؟`
      )
    )
      return;
    startTransition(async () => {
      const res = await createSettlement({ storeId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `تم إنشاء تسوية بمبلغ ${formatEGP(res.amount ?? 0)} لـ ${res.count} طلب`
      );
      if (res.id) {
        router.push(`/admin/settlements/${res.id}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Button
      onClick={onClick}
      disabled={pending}
      className="bg-green-600 hover:bg-green-700"
    >
      {pending ? "جاري الإنشاء..." : "إنشاء تسوية للأوردرات المتبقية"}
    </Button>
  );
}
