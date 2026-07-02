import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { StoreSidebarNav } from "@/components/store/sidebar-nav";
import { LogoutButton } from "@/components/store/logout-button";
import { StoreOpenToggle } from "@/components/store/store-open-toggle";
import { StoreRealtimeListener } from "@/components/store/realtime-listener";
import { NotificationsBell } from "@/components/notifications-bell";
import { PushPrompt } from "@/components/push-prompt";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStore();
  const store = await db.store.findUnique({ where: { id: user.storeId } });
  if (!store) redirect("/login");

  const storeName = store.nameAr ?? store.name;
  const logoLetter = (storeName?.[0] ?? "ب").toUpperCase();
  const ownerLetter = (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] text-[#111827]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[248px] shrink-0 flex-col border-e border-[#E5E7EB] bg-white sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E5E7EB]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#16A34A] text-white font-bold">
            {logoLetter}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#111827] leading-tight truncate">
              {storeName}
            </div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">
              لوحة تحكم البقالة
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <StoreSidebarNav />
        </div>
        <div className="border-t border-[#E5E7EB] px-4 py-3 text-[11px] text-[#6B7280]">
          الإصدار 1.0 · بقال
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden md:flex h-8 w-1 rounded-full bg-[#16A34A]" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-[#6B7280] leading-none">
                منصة إدارة العمليات
              </div>
              <div className="text-sm font-bold text-[#111827] mt-1 truncate">
                {storeName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <StoreOpenToggle initialIsOpen={store.isOpen} />

            <div className="hidden md:block h-6 w-px bg-[#E5E7EB]" />

            <NotificationsBell />

            <div className="hidden md:flex items-center gap-3 pe-1">
              <div className="text-right">
                <div className="text-[12px] font-bold text-[#111827] leading-none">
                  {user.name ?? user.email}
                </div>
                <div className="text-[10px] text-[#6B7280] mt-1">
                  مالك البقالة
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DCFCE7] text-[#166534] font-bold text-sm">
                {ownerLetter}
              </div>
            </div>

            <div className="h-6 w-px bg-[#E5E7EB]" />
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>

      <StoreRealtimeListener storeId={store.id} />
      <PushPrompt />
    </div>
  );
}
