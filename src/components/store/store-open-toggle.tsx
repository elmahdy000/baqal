"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { toggleStoreOpen } from "@/server/actions/store";
import { cn } from "@/lib/utils";

export function StoreOpenToggle({ initialIsOpen }: { initialIsOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const prev = isOpen;
      setIsOpen(!prev);
      const res = await toggleStoreOpen();
      if (!res.ok) {
        setIsOpen(prev);
        toast.error(res.error);
      } else {
        toast.success(!prev ? "البقالة مفتوحة الآن" : "البقالة مغلقة الآن");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60",
        isOpen
          ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534] hover:bg-[#DCFCE7]"
          : "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2]"
      )}
      aria-pressed={isOpen}
      title={isOpen ? "اضغط لإغلاق البقالة" : "اضغط لفتح البقالة"}
    >
      <span className="relative flex h-2 w-2">
        {isOpen && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            isOpen ? "bg-[#16A34A]" : "bg-[#DC2626]"
          )}
        />
      </span>
      {isOpen ? "البقالة مفتوحة" : "البقالة مغلقة"}
    </button>
  );
}
