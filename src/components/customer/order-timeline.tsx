"use client";

import { cn } from "@/lib/utils";
import type { OrderStatus } from "@prisma/client";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "PENDING", label: "تم إرسال الطلب" },
  { key: "ACCEPTED", label: "البقال قبل الطلب" },
  { key: "PREPARING", label: "طلبك بيتجهز" },
  { key: "OUT_FOR_DELIVERY", label: "الدليفري طالعلك" },
  { key: "DELIVERED", label: "تم التوصيل" },
];

const ORDER_INDEX: Record<OrderStatus, number> = {
  PENDING: 0,
  ACCEPTED: 1,
  PREPARING: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  CANCELLED: -1,
  REJECTED: -1,
};

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED" || status === "REJECTED") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-red-50/50 border border-red-100 p-4">
        <XCircle className="h-6 w-6 text-red-500 shrink-0" />
        <div>
          <div className="font-extrabold text-red-800 text-sm">
            {status === "CANCELLED" ? "الطلب اتلغى" : "الطلب اترفض"}
          </div>
          <div className="text-xs text-red-500 font-bold mt-0.5">
            راجع البقال أو ابعت طلب جديد
          </div>
        </div>
      </div>
    );
  }

  const current = ORDER_INDEX[status];

  return (
    <ol className="space-y-4">
      {STEPS.map((s, idx) => {
        const state = idx < current ? "done" : idx === current ? "active" : "future";
        return (
          <li key={s.key} className="flex items-center gap-3">
            {state === "done" ? (
              <CheckCircle2 className="h-6 w-6 text-[#0c4a3b] shrink-0" />
            ) : state === "active" ? (
              <div className="relative shrink-0">
                <Circle className="h-6 w-6 text-[#0c4a3b] fill-[#e6f4f1]" />
                <span className="absolute inset-0 m-auto h-2.5 w-2.5 rounded-full bg-[#0c4a3b] animate-pulse" />
              </div>
            ) : (
              <Circle className="h-6 w-6 text-gray-250 shrink-0" />
            )}
            <span
              className={cn(
                "text-sm transition-all duration-200",
                state === "done"
                  ? "text-[#0c4a3b] font-bold"
                  : state === "active"
                  ? "text-gray-900 font-black"
                  : "text-gray-400 font-bold"
              )}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
