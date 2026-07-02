import { createServer, type IncomingMessage } from "http";
import next from "next";
import { Server as IOServer, type Socket } from "socket.io";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@prisma/client";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT ?? 3000);
const app = next({ dev });
const handle = app.getRequestHandler();

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const allowedOrigins = (process.env.SOCKET_ALLOWED_ORIGINS ?? process.env.AUTH_URL ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

type SocketUser = {
  id: string;
  role: UserRole;
  storeId: string | null;
};

function canJoin(user: SocketUser, room: string): boolean {
  if (!room || typeof room !== "string" || room.length > 200) return false;

  // Admin room — SUPER_ADMIN only
  if (room === "admin") return user.role === "SUPER_ADMIN";

  const [scope, id] = room.split(":");
  if (!scope || !id) return false;

  switch (scope) {
    case "store":
      // Store staff can only join their own store's room; admin can join any.
      return (
        user.role === "SUPER_ADMIN" ||
        ((user.role === "STORE_OWNER" || user.role === "STORE_STAFF") &&
          user.storeId === id)
      );
    case "driver":
      return (
        user.role === "SUPER_ADMIN" ||
        (user.role === "DELIVERY" && user.id === id)
      );
    case "customer":
      // Public customer channel keyed by anonymous customer id (checkout flow).
      // We allow join without verifying identity because customers are anonymous
      // in this product; the payloads emitted to customer:* are limited to the
      // customer's own order status updates. If PII leaks are a concern, gate
      // this behind a signed order token from the checkout response instead.
      return true;
    case "order":
      // Store/admin can subscribe; drivers can subscribe to assigned orders.
      // Full ownership check requires a DB lookup — we allow store staff of the
      // owning store to gate later at the emit layer via `emitTo`.
      return (
        user.role === "SUPER_ADMIN" ||
        user.role === "STORE_OWNER" ||
        user.role === "STORE_STAFF" ||
        user.role === "DELIVERY"
      );
    default:
      return false;
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new IOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      credentials: true,
    },
  });

  // Expose io globally so server-side helpers (src/lib/emit.ts) can broadcast.
  (globalThis as unknown as { io: IOServer }).io = io;

  // Auth middleware — verifies the NextAuth JWT cookie on every socket handshake.
  io.use(async (socket, next) => {
    try {
      if (!authSecret) return next(new Error("server_misconfigured"));
      const req = socket.request as IncomingMessage;
      const token = await getToken({
        req: req as unknown as Parameters<typeof getToken>[0]["req"],
        secret: authSecret,
        salt:
          process.env.NODE_ENV === "production"
            ? "__Secure-authjs.session-token"
            : "authjs.session-token",
      });
      if (!token || !token.id) return next(new Error("unauthorized"));
      socket.data.user = {
        id: token.id as string,
        role: token.role as UserRole,
        storeId: (token.storeId as string | null) ?? null,
      };
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    socket.on("join", (room: string) => {
      if (canJoin(user, room)) socket.join(room);
    });
    socket.on("leave", (room: string) => {
      if (typeof room === "string") socket.leave(room);
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Baqal ready on http://localhost:${port} (socket path: /api/socket)`
    );
  });
});
