"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { markSettlementPaid } from "@/server/actions/admin";

export function SettlementActions({
  id,
  status,
  method,
  reference,
  notes,
}: {
  id: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  method: string | null;
  reference: string | null;
  notes: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [methodValue, setMethodValue] = useState<string>(method ?? "CASH");
  const [referenceValue, setReferenceValue] = useState<string>(reference ?? "");
  const [notesValue, setNotesValue] = useState<string>(notes ?? "");

  const disabled = status !== "PENDING";

  const onMarkPaid = () => {
    startTransition(async () => {
      const res = await markSettlementPaid(id, {
        status: "PAID",
        method: methodValue,
        reference: referenceValue || undefined,
        notes: notesValue || undefined,
      });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("تم تسجيل الدفع");
        router.refresh();
      }
    });
  };

  const onCancel = () => {
    if (!confirm("هل أنت متأكد من إلغاء هذه التسوية؟ سيتم فك الأوردرات لتسوية أخرى.")) return;
    startTransition(async () => {
      const res = await markSettlementPaid(id, {
        status: "CANCELLED",
      });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("تم الإلغاء");
        router.refresh();
      }
    });
  };

  if (disabled) {
    return (
      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
        التسوية {status === "PAID" ? "مدفوعة" : "ملغية"} — لا يمكن التعديل.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="method">طريقة الدفع</Label>
          <select
            id="method"
            value={methodValue}
            onChange={(e) => setMethodValue(e.target.value)}
            className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="CASH">كاش</option>
            <option value="BANK_TRANSFER">تحويل بنكي</option>
            <option value="INSTAPAY">إنستاباي</option>
            <option value="VODAFONE_CASH">فودافون كاش</option>
            <option value="OTHER">أخرى</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="reference">المرجع</Label>
          <Input
            id="reference"
            value={referenceValue}
            onChange={(e) => setReferenceValue(e.target.value)}
            placeholder="رقم تحويل أو مرجع"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">ملاحظات</Label>
        <textarea
          id="notes"
          value={notesValue}
          onChange={(e) => setNotesValue(e.target.value)}
          rows={3}
          className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onMarkPaid} disabled={pending}>
          {pending ? "جاري الحفظ..." : "تسجيل الدفع (PAID)"}
        </Button>
        <Button variant="destructive" onClick={onCancel} disabled={pending}>
          إلغاء التسوية
        </Button>
      </div>
    </div>
  );
}
