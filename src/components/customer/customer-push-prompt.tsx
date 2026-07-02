"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getCart, getProfile } from "@/lib/cart";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

const DISMISS_KEY = "baqal:push-dismissed-customer";

export function CustomerPushPrompt({ storeSlug }: { storeSlug?: string }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [effectiveSlug, setEffectiveSlug] = useState<string | undefined>(storeSlug);
  const [phone, setPhone] = useState<string | undefined>();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const cart = getCart();
    const profile = getProfile();
    const slug = storeSlug || cart.storeSlug;
    if (!slug) return;
    if (!profile.phone || profile.phone.length < 6) return;

    setEffectiveSlug(slug);
    setPhone(profile.phone);
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, [storeSlug]);

  const enable = async () => {
    if (!effectiveSlug || !phone) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setVisible(false);
        return;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          storeSlug: effectiveSlug,
          customerPhone: phone,
        }),
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
    <div className="fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="text-sm font-semibold text-gray-900">فعّل الإشعارات</div>
      <div className="mt-1 text-xs text-gray-600">
        هيوصلك تنبيه لما البقال يقبل طلبك ولحد ما يوصل باب الشقة
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={dismiss} disabled={busy}>
          لاحقاً
        </Button>
        <Button size="sm" onClick={enable} disabled={busy}>
          {busy ? "..." : "فعّل"}
        </Button>
      </div>
    </div>
  );
}
