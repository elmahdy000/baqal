"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  SupportTicketStatus,
  SupportTicketPriority,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  replyToSupportTicket,
  updateSupportTicketStatus,
  updateSupportTicketPriority,
} from "@/server/actions/support";
import { supportStatusLabel, supportPriorityLabel } from "@/lib/labels";

const STATUSES: SupportTicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const PRIORITIES: SupportTicketPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

export function SupportTicketReplyForm({ id }: { id: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = body.trim();
    if (value.length < 1) {
      toast.error("اكتب ردك قبل الإرسال");
      return;
    }
    startTransition(async () => {
      const res = await replyToSupportTicket(id, { body: value });
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success("تم إرسال الرد");
        setBody("");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="reply-body">ردك</Label>
        <textarea
          id="reply-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          disabled={pending}
          placeholder="اكتب ردك للبقال هنا..."
          className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || body.trim().length === 0}>
          {pending ? "جاري الإرسال..." : "إرسال الرد"}
        </Button>
      </div>
    </form>
  );
}

export function SupportTicketStatusControl({
  id,
  status,
}: {
  id: string;
  status: SupportTicketStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<SupportTicketStatus>(status);
  const [pending, startTransition] = useTransition();

  const onChange = (next: SupportTicketStatus) => {
    if (next === value) return;
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const res = await updateSupportTicketStatus(id, next);
      if (!res.ok) {
        toast.error(res.error);
        setValue(prev);
      } else {
        toast.success("تم تحديث الحالة");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-1">
      <Label htmlFor="status-select">الحالة</Label>
      <select
        id="status-select"
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as SupportTicketStatus)}
        className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {supportStatusLabel(s)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SupportTicketPriorityControl({
  id,
  priority,
}: {
  id: string;
  priority: SupportTicketPriority;
}) {
  const router = useRouter();
  const [value, setValue] = useState<SupportTicketPriority>(priority);
  const [pending, startTransition] = useTransition();

  const onChange = (next: SupportTicketPriority) => {
    if (next === value) return;
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const res = await updateSupportTicketPriority(id, next);
      if (!res.ok) {
        toast.error(res.error);
        setValue(prev);
      } else {
        toast.success("تم تحديث الأولوية");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-1">
      <Label htmlFor="priority-select">الأولوية</Label>
      <select
        id="priority-select"
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as SupportTicketPriority)}
        className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {supportPriorityLabel(p)}
          </option>
        ))}
      </select>
    </div>
  );
}
