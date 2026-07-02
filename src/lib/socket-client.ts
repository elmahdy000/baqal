"use client";
import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    socket = io(url || undefined, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}
