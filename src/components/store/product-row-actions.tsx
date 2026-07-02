"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteProduct,
  duplicateProduct,
  toggleProductAvailable,
} from "@/server/actions/store";

export function ProductRowActions({
  productId,
  isAvailable,
}: {
  productId: string;
  isAvailable: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const onToggle = () => {
    startTransition(async () => {
      const res = await toggleProductAvailable(productId);
      if (!res.ok) toast.error(res.error);
      else toast.success(isAvailable ? "تم إخفاء المنتج" : "تم إظهار المنتج");
    });
  };

  const onDuplicate = () => {
    startTransition(async () => {
      const res = await duplicateProduct(productId);
      if (!res.ok) toast.error(res.error);
      else toast.success("تم نسخ المنتج");
    });
  };

  const onDelete = () => {
    if (!window.confirm("تأكيد حذف المنتج؟")) return;
    startTransition(async () => {
      const res = await deleteProduct(productId);
      if (!res.ok) toast.error(res.error);
      else toast.success("تم الحذف");
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button asChild size="sm" variant="outline">
        <Link href={`/store/products/${productId}/edit`}>تعديل</Link>
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={onDuplicate}
        title="نسخ"
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={onToggle}
        title={isAvailable ? "إخفاء" : "إظهار"}
      >
        <Power className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={onDelete}
        title="حذف"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
