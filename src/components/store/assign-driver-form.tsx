"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { assignDriver } from "@/server/actions/store";

export function AssignDriverForm({
  orderId,
  currentDriverId,
  drivers,
}: {
  orderId: string;
  currentDriverId: string;
  drivers: { id: string; label: string }[];
}) {
  const [driverId, setDriverId] = useState(currentDriverId);
  const [pending, startTransition] = useTransition();

  if (drivers.length === 0) {
    return (
      <div className="text-xs text-gray-500">
        لا يوجد سائقين مفعّلين — أضف سائق من صفحة السائقين
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!driverId) {
          toast.error("اختر سائق");
          return;
        }
        startTransition(async () => {
          const res = await assignDriver(orderId, driverId);
          if (!res.ok) toast.error(res.error);
          else toast.success("تم التعيين");
        });
      }}
      className="flex flex-col gap-2"
    >
      <select
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
        className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">اختر سائق</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={pending}>
        {pending ? "جاري الحفظ..." : "حفظ"}
      </Button>
    </form>
  );
}
