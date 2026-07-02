// Server-side emitter helper. Emits via the in-process Socket.IO server
// attached to globalThis by server.ts. Safe to call from server actions.
import type { Server as IOServer } from "socket.io";

type G = typeof globalThis & { io?: IOServer };

export function getIO(): IOServer | null {
  return (globalThis as G).io ?? null;
}

export function emitTo(room: string, event: string, payload: unknown) {
  const io = getIO();
  if (!io) return;
  io.to(room).emit(event, payload);
}
