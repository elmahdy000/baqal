"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X, Bell } from "lucide-react";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

const DISMISS_KEY = "baqal:push-dismissed";

export function PushPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setVisible(false);
        return;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        toast.error("مفاتيح الإشعارات غير مضبوطة");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        toast.error("فشل تفعيل الإشعارات");
        return;
      }
      toast.success("الإشعارات مفعّلة");
      setVisible(false);
    } catch {
      toast.error("فشل تفعيل الإشعارات");
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 start-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[440px] rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#16A34A]">
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-[#111827] leading-tight">
            فعّل تنبيهات الطلبات
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5 leading-tight">
            استلم الطلبات فوراً حتى لو التبويب مقفول.
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            onClick={enable}
            disabled={busy}
            className="h-8 px-3 text-xs bg-[#16A34A] hover:bg-[#15803D] text-white font-bold"
          >
            {busy ? "..." : "فعّل"}
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className="text-[#9CA3AF] hover:text-[#111827] rounded-md p-1.5 transition-colors"
            disabled={busy}
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
