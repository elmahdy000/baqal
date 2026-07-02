"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markDelivered } from "@/server/actions/driver";

export function DeliveredButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      className="w-full"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await markDelivered(orderId);
          if (!res.ok) toast.error(res.error);
          else toast.success("تم تسليم الطلب");
        });
      }}
    >
      <CheckCircle2 className="h-4 w-4" />
      <span>{pending ? "جاري الحفظ..." : "تم التوصيل"}</span>
    </Button>
  );
}
