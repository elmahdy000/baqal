"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { updateOrderStatus, rejectOrder } from "@/server/actions/store";

export function OrderActionButtons({
  orderId,
  status,
  compact = false,
}: {
  orderId: string;
  status: OrderStatus;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const run = (next: OrderStatus, note?: string) => {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, next, note);
      if (!res.ok) toast.error(res.error);
      else toast.success("تم التحديث");
    });
  };

  const submitReject = () => {
    if (reason.trim().length < 2) {
      toast.error("اكتب سبب الرفض");
      return;
    }
    startTransition(async () => {
      const res = await rejectOrder(orderId, reason.trim());
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("تم رفض الطلب");
        setRejectOpen(false);
        setReason("");
      }
    });
  };

  const size = compact ? "sm" : "default";

  if (status === "PENDING") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button size={size} disabled={pending} onClick={() => run("ACCEPTED")}>
            قبول
          </Button>
          <Button
            size={size}
            variant="destructive"
            disabled={pending}
            onClick={() => setRejectOpen((v) => !v)}
          >
            رفض
          </Button>
        </div>
        {rejectOpen && (
          <div className="flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50 p-3">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="سبب الرفض"
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={submitReject}
              >
                تأكيد الرفض
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => setRejectOpen(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <Button size={size} disabled={pending} onClick={() => run("PREPARING")}>
        ابدأ التحضير
      </Button>
    );
  }
  if (status === "PREPARING") {
    return (
      <Button size={size} disabled={pending} onClick={() => run("OUT_FOR_DELIVERY")}>
        أرسل للتوصيل
      </Button>
    );
  }
  if (status === "OUT_FOR_DELIVERY") {
    return (
      <Button size={size} disabled={pending} onClick={() => run("DELIVERED")}>
        تم التوصيل
      </Button>
    );
  }
  return null;
}
