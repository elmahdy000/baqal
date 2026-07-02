import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { formatEGP, cn } from "@/lib/utils";
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  Trophy,
  Sparkles,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

const COUNTED_STATUSES = [
  "ACCEPTED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

type Segment = "all" | "vip" | "active" | "dormant" | "new";

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "vip", label: "VIP" },
  { key: "active", label: "نشطون" },
  { key: "new", label: "جدد" },
  { key: "dormant", label: "خاملون" },
];

function normalizeEgyptPhone(raw: string): string {
  // Digits only, strip leading zero; prefix +20 for international dialers.
  const digits = raw.replace(/[^\d]/g, "");
  const trimmed = digits.startsWith("0") ? digits.slice(1) : digits;
  return `+20${trimmed}`;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0]!.charAt(0);
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).trim();
}

const DAY = 24 * 60 * 60 * 1000;

export default async function StoreCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; seg?: string }>;
}) {
  const user = await requireStore();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const seg: Segment = (["all", "vip", "active", "dormant", "new"].includes(
    sp.seg ?? ""
  )
    ? sp.seg
    : "all") as Segment;

  const where: Prisma.CustomerWhereInput = { storeId: user.storeId };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
    },
  });

  const customerIds = customers.map((c) => c.id);

  const stats = customerIds.length
    ? await db.order.groupBy({
        by: ["customerId"],
        where: {
          storeId: user.storeId,
          customerId: { in: customerIds },
          status: { in: [...COUNTED_STATUSES] },
        },
        _count: { _all: true },
        _sum: { total: true },
        _max: { createdAt: true },
      })
    : [];

  const statsByCustomer = new Map<
    string,
    { orders: number; spent: number; lastAt: Date | null }
  >();
  stats.forEach((s) => {
    statsByCustomer.set(s.customerId, {
      orders: s._count._all,
      spent: Number(s._sum.total ?? 0),
      lastAt: s._max.createdAt,
    });
  });

  const now = Date.now();

  const enriched = customers.map((c) => {
    const s = statsByCustomer.get(c.id) ?? { orders: 0, spent: 0, lastAt: null };
    const daysSinceLast = s.lastAt ? (now - s.lastAt.getTime()) / DAY : Infinity;
    const daysSinceJoin = (now - c.createdAt.getTime()) / DAY;
    const isVip = s.orders >= 5;
    const isNew = daysSinceJoin <= 7;
    const isActive = s.lastAt !== null && daysSinceLast <= 30;
    const isDormant = s.lastAt !== null && daysSinceLast > 60;
    return {
      ...c,
      ...s,
      isVip,
      isNew,
      isActive,
      isDormant,
    };
  });

  const counts = {
    all: enriched.length,
    vip: enriched.filter((c) => c.isVip).length,
    active: enriched.filter((c) => c.isActive).length,
    new: enriched.filter((c) => c.isNew).length,
    dormant: enriched.filter((c) => c.isDormant).length,
  };

  const filtered = enriched.filter((c) => {
    if (seg === "all") return true;
    if (seg === "vip") return c.isVip;
    if (seg === "active") return c.isActive;
    if (seg === "new") return c.isNew;
    if (seg === "dormant") return c.isDormant;
    return true;
  });

  const rows = filtered.sort((a, b) => {
    const at = a.lastAt?.getTime() ?? 0;
    const bt = b.lastAt?.getTime() ?? 0;
    return bt - at;
  });

  // Aggregate KPIs across ALL customers (not filtered) for the top strip.
  const totalRevenue = enriched.reduce((s, c) => s + c.spent, 0);
  const totalOrders = enriched.reduce((s, c) => s + c.orders, 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">العملاء</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            عملاء البقالة، إحصاءاتهم، وأدوات التواصل السريع
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="إجمالي العملاء"
          value={counts.all.toString()}
          hint={`${counts.new} انضم هذا الأسبوع`}
          icon={Users}
          tone="neutral"
        />
        <KpiCard
          label="عملاء نشطون"
          value={counts.active.toString()}
          hint="آخر 30 يوم"
          icon={Clock}
          tone="success"
        />
        <KpiCard
          label="عملاء VIP"
          value={counts.vip.toString()}
          hint="5 طلبات أو أكثر"
          icon={Trophy}
          tone="warn"
        />
        <KpiCard
          label="متوسط الطلب"
          value={formatEGP(avgOrder)}
          hint={`إيراد إجمالي: ${formatEGP(totalRevenue)}`}
          icon={Sparkles}
          tone="brand"
        />
      </div>

      {/* Search + segments */}
      <div className="flex flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-sm sm:flex-row sm:items-center">
        <form className="relative flex-1">
          {/* Keep segment param across searches */}
          {seg !== "all" && <input type="hidden" name="seg" value={seg} />}
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="ابحث بالاسم أو رقم الموبايل..."
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 pe-10 text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#16A34A] focus:bg-white focus:ring-2 focus:ring-[#DCFCE7]"
          />
        </form>
        <div className="flex items-center gap-1 overflow-x-auto">
          {SEGMENTS.map((s) => {
            const active = seg === s.key;
            const n =
              s.key === "all"
                ? counts.all
                : s.key === "vip"
                  ? counts.vip
                  : s.key === "active"
                    ? counts.active
                    : s.key === "new"
                      ? counts.new
                      : counts.dormant;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (s.key !== "all") params.set("seg", s.key);
            const href = `/store/customers${params.toString() ? `?${params.toString()}` : ""}`;
            return (
              <Link
                key={s.key}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition",
                  active
                    ? "bg-[#16A34A] text-white shadow-sm"
                    : "bg-[#F8FAFC] text-[#374151] ring-1 ring-[#E5E7EB] hover:bg-[#F3F4F6]"
                )}
              >
                <span>{s.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0 text-[9px] font-black tabular-nums",
                    active ? "bg-white/25 text-white" : "bg-white text-[#6B7280]"
                  )}
                >
                  {n}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Rows */}
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-[#9CA3AF]">
            <Users className="h-9 w-9" />
            <p className="text-sm font-semibold text-[#111827]">
              {q || seg !== "all"
                ? "مفيش عملاء مطابقين للبحث"
                : "لسه مفيش عملاء"}
            </p>
            <p className="text-xs">
              أول ما حد يطلب من البقالة هيبان هنا مع إحصاءاته.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F3F4F6]">
            {rows.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[#F8FAFC]"
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-sm ring-1",
                    c.isVip
                      ? "bg-[#FEF3C7] text-[#92400E] ring-[#FDE68A]"
                      : c.isDormant
                        ? "bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]"
                        : "bg-[#DCFCE7] text-[#166534] ring-[#BBF7D0]"
                  )}
                  aria-hidden
                >
                  {initialsFrom(c.name)}
                </div>

                {/* Name + tags */}
                <Link
                  href={`/store/customers/${c.id}`}
                  className="min-w-0 flex-1 group"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-bold text-[#111827] group-hover:text-[#16A34A]">
                      {c.name}
                    </span>
                    {c.isVip && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-1.5 py-0.5 text-[9px] font-black text-[#92400E] ring-1 ring-[#FDE68A]">
                        <Trophy className="h-2.5 w-2.5" /> VIP
                      </span>
                    )}
                    {c.isNew && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#DBEAFE] px-1.5 py-0.5 text-[9px] font-black text-[#1E40AF] ring-1 ring-[#BFDBFE]">
                        <Sparkles className="h-2.5 w-2.5" /> جديد
                      </span>
                    )}
                    {c.isDormant && (
                      <span className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5 text-[9px] font-black text-[#6B7280] ring-1 ring-[#E5E7EB]">
                        خامل
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#6B7280]">
                    <span className="font-mono tabular-nums" dir="ltr">
                      {c.phone}
                    </span>
                    <span>·</span>
                    <span>
                      {c.orders > 0
                        ? `${c.orders} طلب`
                        : "لسه مفيش طلبات"}
                    </span>
                    {c.lastAt && (
                      <>
                        <span>·</span>
                        <span>
                          آخر طلب{" "}
                          {formatDistanceToNow(c.lastAt, {
                            addSuffix: true,
                            locale: arEG,
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </Link>

                {/* Spent */}
                <div className="hidden shrink-0 flex-col items-end sm:flex">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                    إجمالي
                  </div>
                  <div className="text-sm font-black tabular-nums text-[#111827] leading-none">
                    {formatEGP(c.spent)}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={`https://wa.me/${normalizeEgyptPhone(c.phone).replace("+", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="واتساب"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#16A34A] transition hover:bg-[#F0FDF4]"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                  <a
                    href={`tel:${normalizeEgyptPhone(c.phone)}`}
                    aria-label="اتصال"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#0369A1] transition hover:bg-[#F0F9FF]"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "neutral" | "success" | "warn" | "brand";
}) {
  const t = {
    neutral: { bg: "bg-[#F3F4F6]", fg: "text-[#374151]", value: "text-[#111827]" },
    success: { bg: "bg-[#DCFCE7]", fg: "text-[#166534]", value: "text-[#15803D]" },
    warn: { bg: "bg-[#FEF3C7]", fg: "text-[#92400E]", value: "text-[#92400E]" },
    brand: { bg: "bg-[#DBEAFE]", fg: "text-[#1E40AF]", value: "text-[#111827]" },
  }[tone];
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium text-[#6B7280]">{label}</div>
          <div
            className={cn(
              "mt-1.5 text-2xl font-black tracking-tight tabular-nums",
              t.value
            )}
          >
            {value}
          </div>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            t.bg,
            t.fg
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 border-t border-[#F3F4F6] pt-2 text-[11px] text-[#6B7280]">
        {hint}
      </div>
    </div>
  );
}
