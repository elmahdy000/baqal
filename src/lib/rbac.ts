import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/login");
  return user;
}

export async function requireAdmin() {
  return requireRole("SUPER_ADMIN");
}

export async function requireStore() {
  const user = await requireRole("STORE_OWNER", "STORE_STAFF");
  if (!user.storeId) redirect("/login");
  return user as typeof user & { storeId: string };
}
