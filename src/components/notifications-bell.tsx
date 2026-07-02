"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket-client";
import { EVENTS } from "@/lib/realtime";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: { url?: string } | null;
};

type Response = { items: Notification[]; unreadCount: number };

async function fetchNotifications(): Promise<Response> {
  const res = await fetch("/api/notifications", { cache: "no-store" });
  if (!res.ok) throw new Error("failed");
  return (await res.json()) as Response;
}

export function NotificationsBell() {
  const qc = useQueryClient();
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const socket = getSocket();
    const handler = () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    };
    socket.on(EVENTS.NOTIFICATION_NEW, handler);
    socket.on(EVENTS.ORDER_NEW, handler);
    return () => {
      socket.off(EVENTS.NOTIFICATION_NEW, handler);
      socket.off(EVENTS.ORDER_NEW, handler);
    };
  }, [qc]);

  const items = data?.items ?? [];
  const unread = data?.unreadCount ?? 0;

  const markAllRead = async () => {
    await fetch("/api/notifications?markAllRead=1", { method: "POST" });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      await fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
    const url = n.data?.url ?? "/store/orders";
    router.push(url);
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] transition-colors"
          aria-label={`الإشعارات${unread > 0 ? ` — ${unread} غير مقروءة` : ""}`}
        >
          <Bell className="h-4 w-4 text-[#6B7280]" />
          {unread > 0 && (
            <span className="absolute -top-1 -end-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          dir="rtl"
          className="z-50 w-[360px] rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="text-sm font-semibold text-gray-900">
              الإشعارات
            </div>
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-green-700 hover:underline"
              disabled={unread === 0}
            >
              قراءة الكل
            </button>
          </div>
          <ScrollArea.Root className="h-[400px] overflow-hidden">
            <ScrollArea.Viewport className="h-full w-full">
              {items.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">
                  مفيش إشعارات
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleClick(n)}
                        className={cn(
                          "block w-full px-4 py-3 text-right hover:bg-gray-50",
                          !n.isRead && "bg-green-50/40"
                        )}
                      >
                        <div
                          className={cn(
                            "text-sm",
                            n.isRead
                              ? "font-medium text-gray-600"
                              : "font-semibold text-gray-900"
                          )}
                        >
                          {n.title}
                        </div>
                        <div
                          className={cn(
                            "mt-1 line-clamp-2 text-xs",
                            n.isRead ? "text-gray-500" : "text-gray-700"
                          )}
                        >
                          {n.body}
                        </div>
                        <div className="mt-1 text-[10px] text-gray-400">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                            locale: arEG,
                          })}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation="vertical"
              className="flex w-2 touch-none select-none bg-gray-50 p-0.5"
            >
              <ScrollArea.Thumb className="relative flex-1 rounded-full bg-gray-300" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
