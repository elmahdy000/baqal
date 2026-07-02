"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateStoreSettings } from "@/server/actions/store";
import {
  DAY_KEYS,
  DAY_LABELS_AR,
  defaultHoursJson,
  parseOpeningHours,
  type DayKey,
  type WeeklyHours,
} from "@/lib/hours";

type Values = {
  name: string;
  nameAr: string;
  phone: string;
  deliveryFee: number;
  minOrderAmount: number;
};

type DayRow = { closed: boolean; open: string; close: string };

function initialWeekly(raw: string): Record<DayKey, DayRow> {
  const parsed = parseOpeningHours(raw) ?? defaultHoursJson();
  const out = {} as Record<DayKey, DayRow>;
  for (const key of DAY_KEYS) {
    const d = parsed.weekly[key];
    out[key] = d
      ? { closed: false, open: d.open, close: d.close }
      : { closed: true, open: "09:00", close: "23:00" };
  }
  return out;
}

export function StoreSettingsForm({
  initial,
}: {
  initial: Values & { openingHours: string };
}) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm<Values>({ defaultValues: initial });
  const [week, setWeek] = useState<Record<DayKey, DayRow>>(() =>
    initialWeekly(initial.openingHours)
  );

  const openingHoursJson = useMemo(() => {
    const weekly: WeeklyHours = {
      sun: null, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null,
    };
    for (const key of DAY_KEYS) {
      const row = week[key];
      weekly[key] = row.closed ? null : { open: row.open, close: row.close };
    }
    return JSON.stringify({ weekly });
  }, [week]);

  const onSubmit = (values: Values) => {
    startTransition(async () => {
      const res = await updateStoreSettings({ ...values, openingHours: openingHoursJson });
      if (!res.ok) toast.error(res.error);
      else toast.success("تم حفظ الإعدادات");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nameAr">الاسم (عربي)</Label>
          <Input id="nameAr" {...register("nameAr")} />
        </div>
        <div>
          <Label htmlFor="name">الاسم (إنجليزي)</Label>
          <Input id="name" {...register("name", { required: true })} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input id="phone" {...register("phone")} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="deliveryFee">رسوم التوصيل (ج.م)</Label>
          <Input
            id="deliveryFee"
            type="number"
            step="0.01"
            min={0}
            {...register("deliveryFee", { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="minOrderAmount">الحد الأدنى للطلب (ج.م)</Label>
          <Input
            id="minOrderAmount"
            type="number"
            step="0.01"
            min={0}
            {...register("minOrderAmount", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <div className="mb-3">
          <div className="font-medium text-gray-900">مواعيد العمل</div>
          <div className="text-xs text-gray-500">حدد ساعات الفتح والإغلاق لكل يوم</div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {DAY_KEYS.map((key) => {
            const row = week[key];
            return (
              <div
                key={key}
                className="grid grid-cols-1 items-center gap-2 rounded-lg bg-gray-50 p-2 sm:grid-cols-[100px_auto_1fr_1fr]"
              >
                <div className="font-medium text-sm text-gray-800">{DAY_LABELS_AR[key]}</div>
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={row.closed}
                    onChange={(e) =>
                      setWeek((w) => ({ ...w, [key]: { ...w[key], closed: e.target.checked } }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-green-600"
                  />
                  <span>مغلق</span>
                </label>
                <Input
                  type="time"
                  value={row.open}
                  disabled={row.closed}
                  onChange={(e) =>
                    setWeek((w) => ({ ...w, [key]: { ...w[key], open: e.target.value } }))
                  }
                />
                <Input
                  type="time"
                  value={row.close}
                  disabled={row.closed}
                  onChange={(e) =>
                    setWeek((w) => ({ ...w, [key]: { ...w[key], close: e.target.value } }))
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </div>
    </form>
  );
}
