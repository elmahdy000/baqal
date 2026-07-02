"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Minus, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { adjustStock } from "@/server/actions/store";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  stockQuantity: number;
  unit?: string;
};

type Mode = "add" | "remove" | "set";

const MODE_META: Record<Mode, { label: string; icon: typeof Plus; color: string }> = {
  add: { label: "زيادة كمية", icon: Plus, color: "text-[#16A34A]" },
  remove: { label: "خصم كمية", icon: Minus, color: "text-[#DC2626]" },
  set: { label: "تعديل الرصيد", icon: Edit3, color: "text-[#0369A1]" },
};

const REASON_TYPES: {
  value: "STOCK_IN" | "STOCK_OUT" | "MANUAL_ADJUSTMENT" | "DAMAGED" | "EXPIRED" | "RETURNED";
  label: string;
  forMode: Mode[];
}[] = [
  { value: "STOCK_IN", label: "استلام بضاعة جديدة", forMode: ["add"] },
  { value: "RETURNED", label: "مرتجع من عميل", forMode: ["add"] },
  { value: "MANUAL_ADJUSTMENT", label: "تعديل جرد يدوي", forMode: ["set", "add", "remove"] },
  { value: "STOCK_OUT", label: "خروج بضاعة", forMode: ["remove"] },
  { value: "DAMAGED", label: "تالف", forMode: ["remove"] },
  { value: "EXPIRED", label: "انتهت الصلاحية", forMode: ["remove"] },
];

export function AdjustStockDialog({
  product,
  trigger,
  onDone,
}: {
  product: Product;
  trigger: React.ReactNode;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [amount, setAmount] = useState<string>("");
  const [reasonType, setReasonType] = useState<
    "STOCK_IN" | "STOCK_OUT" | "MANUAL_ADJUSTMENT" | "DAMAGED" | "EXPIRED" | "RETURNED"
  >("STOCK_IN");
  const [reason, setReason] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const amtNum = Number(amount) || 0;
  const preview =
    mode === "add"
      ? product.stockQuantity + amtNum
      : mode === "remove"
        ? Math.max(0, product.stockQuantity - amtNum)
        : Math.max(0, Math.floor(amtNum));

  const validReasons = REASON_TYPES.filter((r) => r.forMode.includes(mode));

  function reset() {
    setMode("add");
    setAmount("");
    setReasonType("STOCK_IN");
    setReason("");
  }

  function handleModeChange(m: Mode) {
    setMode(m);
    // Pick a sensible default reason type per mode
    if (m === "add") setReasonType("STOCK_IN");
    else if (m === "remove") setReasonType("STOCK_OUT");
    else setReasonType("MANUAL_ADJUSTMENT");
  }

  function submit() {
    if (amtNum <= 0 && mode !== "set") {
      toast.error("أدخل كمية أكبر من صفر");
      return;
    }
    startTransition(async () => {
      const res = await adjustStock({
        productId: product.id,
        mode,
        amount: amtNum,
        reason: reason.trim() || undefined,
        reasonType,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `تم التعديل — الرصيد ${res.data!.oldQuantity} ← ${res.data!.newQuantity}`
      );
      reset();
      setOpen(false);
      onDone?.();
    });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#111827]/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#F3F4F6] px-5 py-3">
            <div className="min-w-0">
              <Dialog.Title className="text-sm font-bold text-[#111827]">
                تعديل مخزون
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 truncate text-[11px] text-[#6B7280]">
                {product.name}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="إغلاق"
                className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#111827]"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4">
            {/* Current stock */}
            <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-3 py-2 ring-1 ring-[#E5E7EB]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                الرصيد الحالي
              </span>
              <span className="text-lg font-black text-[#111827] tabular-nums">
                {product.stockQuantity}
              </span>
            </div>

            {/* Mode segmented */}
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#F3F4F6] p-1">
              {(Object.keys(MODE_META) as Mode[]).map((m) => {
                const meta = MODE_META[m];
                const Icon = meta.icon;
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModeChange(m)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-bold transition",
                      active
                        ? "bg-white shadow-sm text-[#111827]"
                        : "text-[#6B7280] hover:text-[#111827]"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", active ? meta.color : "text-[#9CA3AF]")} />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[11px] font-bold text-[#374151]">
                {mode === "set" ? "الرصيد الجديد" : "الكمية"}
              </label>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                placeholder="0"
                className="mt-1 h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-base font-bold tabular-nums outline-none transition focus:border-[#16A34A] focus:ring-2 focus:ring-[#DCFCE7]"
              />
              {(amount !== "" || mode === "set") && (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-[#F0FDF4] px-3 py-2 ring-1 ring-[#BBF7D0]">
                  <span className="text-[11px] font-bold text-[#166534]">
                    الرصيد بعد التعديل
                  </span>
                  <span className="flex items-center gap-2 tabular-nums">
                    <span className="text-[13px] text-[#6B7280] line-through">
                      {product.stockQuantity}
                    </span>
                    <span className="text-xl font-black text-[#15803D]">
                      {preview}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Reason type */}
            <div>
              <label className="block text-[11px] font-bold text-[#374151]">
                السبب
              </label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value as typeof reasonType)}
                className="mt-1 h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-2 text-sm font-medium outline-none transition focus:border-[#16A34A] focus:ring-2 focus:ring-[#DCFCE7]"
              >
                {validReasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div>
              <label className="block text-[11px] font-bold text-[#374151]">
                ملاحظات (اختياري)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="رقم فاتورة الاستلام، اسم المورّد..."
                className="mt-1 h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm outline-none transition focus:border-[#16A34A] focus:ring-2 focus:ring-[#DCFCE7]"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[#F3F4F6] bg-[#F8FAFC] px-5 py-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-bold text-[#374151] hover:bg-[#F3F4F6]"
              >
                إلغاء
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="h-9 rounded-lg bg-[#16A34A] px-4 text-xs font-black text-white shadow-sm hover:bg-[#15803D] disabled:cursor-not-allowed disabled:bg-[#9CA3AF]"
            >
              {pending ? "جاري الحفظ..." : "حفظ التعديل"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
