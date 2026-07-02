"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelOrder } from "@/server/actions/customer";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    if (!confirm("متأكد إنك عايز تلغي الطلب؟")) return;
    startTransition(async () => {
      const res = await cancelOrder(orderId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("تم إلغاء الطلب");
      router.refresh();
    });
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleCancel}
      disabled={isPending}
    >
      {isPending ? "جاري الإلغاء..." : "إلغاء الطلب"}
    </Button>
  );
}
