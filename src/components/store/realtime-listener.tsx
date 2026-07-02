"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { EVENTS, rooms } from "@/lib/realtime";

function playBeep() {
  try {
    const Ctx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1000;
    osc.type = "sine";
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close().catch(() => {});
    }, 200);
  } catch {
    // ignore audio errors
  }
}

export function StoreRealtimeListener({ storeId }: { storeId: string }) {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "/";
    const socket = io(url, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", rooms.store(storeId));
    });

    socket.on(EVENTS.ORDER_NEW, () => {
      const audio = new Audio("/sounds/new-order.mp3");
      audio.play().catch(() => playBeep());
      toast.success("طلب جديد وصل");
      router.refresh();
    });

    socket.on(EVENTS.INVENTORY_LOW_STOCK, (payload: { name?: string; newQty?: number }) => {
      toast.warning(`مخزون منخفض: ${payload?.name ?? ""} — باقي ${payload?.newQty ?? 0}`);
      router.refresh();
    });

    socket.on(EVENTS.INVENTORY_OUT_OF_STOCK, (payload: { name?: string }) => {
      toast.error(`نفد المخزون: ${payload?.name ?? ""}`);
      router.refresh();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [storeId, router]);

  return null;
}
