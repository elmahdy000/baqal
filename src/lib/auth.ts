import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      storeId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    storeId: string | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Per-IP + per-email throttle to blunt credential-stuffing.
        let ip = "unknown";
        try {
          const h = await headers();
          ip =
            h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            h.get("x-real-ip") ??
            "unknown";
        } catch {
          // headers() may be unavailable in some contexts; fall back to email-only key.
        }
        const ipRl = rateLimit(`login-ip:${ip}`, 20, 60_000);
        if (!ipRl.allowed) return null;
        const emailRl = rateLimit(
          `login-email:${parsed.data.email.toLowerCase()}`,
          5,
          60_000
        );
        if (!emailRl.allowed) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.isActive) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
          storeId: user.storeId,
        } as unknown as { id: string; email: string; name: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; role: UserRole; storeId: string | null };
        token.id = u.id;
        token.role = u.role;
        token.storeId = u.storeId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.storeId = (token.storeId as string | null) ?? null;
      }
      return session;
    },
  },
});
