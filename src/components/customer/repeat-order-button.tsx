"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { repeatOrder } from "@/lib/repeat-order";
import { getOrderToken } from "@/lib/cart";

export function RepeatOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const token = getOrderToken(orderId);
      const url = token
        ? `/api/customer/orders/${orderId}?t=${encodeURIComponent(token)}`
        : `/api/customer/orders/${orderId}`;
      const res = await fetch(url);
      if (!res.ok) {
        toast.error("مقدرش أجيب بيانات الطلب");
        return;
      }
      const order = await res.json();
      const result = repeatOrder(order);
      if (result.added === 0) {
        toast.error("مفيش منتجات متاحة من الطلب ده");
        return;
      }
      if (result.skipped.length > 0) {
        toast.success(
          `تم إضافة ${result.added} — تم تخطي ${result.skipped.length} (${result.skipped
            .map((s) => s.name)
            .slice(0, 2)
            .join("، ")}${result.skipped.length > 2 ? "..." : ""})`
        );
      } else {
        toast.success("تم إضافة الطلب للسلة");
      }
      router.push("/cart");
    } catch {
      toast.error("حصل خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} className="w-full" size="lg">
      <RotateCcw className="h-4 w-4 ml-2" />
      {loading ? "جاري التحضير..." : "اطلب نفس الطلب تاني"}
    </Button>
  );
}
