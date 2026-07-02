import { requireAdmin } from "@/lib/rbac";
import { SidebarNav } from "./_components/sidebar-nav";
import { LogoutButton } from "./_components/logout-button";
import { NotificationsBell } from "@/components/notifications-bell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC]">
      <aside className="w-64 shrink-0 border-e border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-100">
          <div className="text-lg font-bold text-green-700">بقال</div>
          <div className="text-xs text-gray-500">لوحة التحكم العامة</div>
        </div>
        <SidebarNav />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {user.name ?? user.email}
            </div>
            <div className="text-xs text-gray-500">مسؤول عام</div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
