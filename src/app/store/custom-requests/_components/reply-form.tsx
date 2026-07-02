"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { replyToCustomRequest } from "@/server/actions/store";

type Status = "ANSWERED_AVAILABLE" | "ANSWERED_UNAVAILABLE" | "ANSWERED_SOON";

const OPTIONS: { value: Status; label: string }[] = [
  { value: "ANSWERED_AVAILABLE", label: "موجود" },
  { value: "ANSWERED_UNAVAILABLE", label: "مش موجود" },
  { value: "ANSWERED_SOON", label: "هجيبهولك خلال ساعة" },
];

export function ReplyForm({
  requestId,
  initialReply,
  initialStatus,
}: {
  requestId: string;
  initialReply?: string;
  initialStatus?: Status;
}) {
  const [reply, setReply] = useState(initialReply ?? "");
  const [status, setStatus] = useState<Status>(
    initialStatus ?? "ANSWERED_AVAILABLE"
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await replyToCustomRequest(requestId, reply, status);
      if (!res.ok) toast.error(res.error);
      else toast.success("تم الرد");
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <Label htmlFor={`reply-${requestId}`}>الرد</Label>
        <textarea
          id={`reply-${requestId}`}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm"
          placeholder="اكتب ردك..."
          required
        />
      </div>
      <div className="flex flex-wrap gap-3">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
          >
            <input
              type="radio"
              name={`status-${requestId}`}
              value={o.value}
              checked={status === o.value}
              onChange={() => setStatus(o.value)}
              className="h-4 w-4"
            />
            {o.label}
          </label>
        ))}
      </div>
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "جاري الحفظ..." : "إرسال الرد"}
      </Button>
    </form>
  );
}
