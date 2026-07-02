"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { EVENTS, rooms } from "@/lib/realtime";

export function OrderRealtime({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io({
        path: "/socket.io",
        transports: ["websocket", "polling"],
      });
      const room = rooms.order(orderId);
      socket.on("connect", () => {
        socket?.emit("join", room);
      });

      const events = Object.values(EVENTS).filter((e) => e.startsWith("order:"));
      const handler = (event: string) => (_payload: unknown) => {
        // A small toast so the user notices the status changed
        const map: Record<string, string> = {
          "order:accepted": "البقال قبل الطلب",
          "order:preparing": "طلبك بيتجهز",
          "order:out_for_delivery": "الدليفري طالعلك",
          "order:delivered": "تم التوصيل",
          "order:cancelled": "الطلب اتلغى",
          "order:rejected": "الطلب اترفض",
        };
        if (map[event]) toast.success(map[event]);
        router.refresh();
      };
      const handlers: Array<{ event: string; fn: (p: unknown) => void }> = [];
      for (const ev of events) {
        const fn = handler(ev);
        handlers.push({ event: ev, fn });
        socket.on(ev, fn);
      }

      return () => {
        for (const h of handlers) socket?.off(h.event, h.fn);
        socket?.disconnect();
      };
    } catch {
      // socket unavailable in dev — ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Marker for prop usage
  void initialStatus;
  return null;
}
