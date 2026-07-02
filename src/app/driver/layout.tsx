import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { LogoutButton } from "@/components/store/logout-button";
import { DriverBottomNav } from "@/components/driver/bottom-nav";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("DELIVERY");
  if (!user.storeId) redirect("/login");

  const store = await db.store.findUnique({ where: { id: user.storeId } });
  if (!store) redirect("/login");

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div>
          <div className="text-sm font-bold text-green-700">
            {store.nameAr ?? store.name}
          </div>
          <div className="text-xs text-gray-500">
            {user.name ?? user.email}
          </div>
        </div>
        <LogoutButton />
      </header>
      <main className="p-4">{children}</main>
      <DriverBottomNav />
    </div>
  );
}
