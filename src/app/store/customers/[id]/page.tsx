import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import { formatEGP, cn } from "@/lib/utils";
import { orderStatusLabel, orderStatusTone } from "@/lib/labels";
import {
  ArrowRight,
  Phone,
  MessageCircle,
  Inbox,
  Trophy,
  Sparkles,
  ShoppingBag,
  Wallet,
  Clock,
  TrendingUp,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

const COUNTED_STATUSES = [
  "ACCEPTED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

const DAY = 24 * 60 * 60 * 1000;

function normalizeEgyptPhone(raw: string): string {
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

export default async function StoreCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStore();
  const { id } = await params;

  const customer = await db.customer.findFirst({
    where: { id, storeId: user.storeId },
    include: {
      addresses: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) notFound();

  const [orders, agg, totalOrdersAll] = await Promise.all([
    db.order.findMany({
      where: { storeId: user.storeId, customerId: customer.id },
      include: {
        building: true,
        address: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.order.aggregate({
      where: {
        storeId: user.storeId,
        customerId: customer.id,
        status: { in: [...COUNTED_STATUSES] },
      },
      _count: { _all: true },
      _sum: { total: true },
      _max: { createdAt: true },
    }),
    db.order.count({
      where: { storeId: user.storeId, customerId: customer.id },
    }),
  ]);

  const totalOrders = agg._count._all;
  const totalSpent = Number(agg._sum.total ?? 0);
  const lastOrderAt = agg._max.createdAt;
  const avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;

  const now = Date.now();
  const daysSinceLast = lastOrderAt
    ? Math.round((now - lastOrderAt.getTime()) / DAY)
    : null;
  const daysSinceJoin = Math.round((now - customer.createdAt.getTime()) / DAY);
  const isVip = totalOrders >= 5;
  const isNew = daysSinceJoin <= 7;
  const isDormant = daysSinceLast !== null && daysSinceLast > 60;

  const phoneIntl = normalizeEgyptPhone(customer.phone);
  const waLink = `https://wa.me/${phoneIntl.replace("+", "")}`;
  const telLink = `tel:${phoneIntl}`;

  // Top product for this customer, computed in JS across their orders.
  const productCount = new Map<string, { name: string; qty: number }>();
  for (const o of orders) {
    for (const it of o.items) {
      const cur = productCount.get(it.productId) ?? {
        name: it.productNameSnapshot,
        qty: 0,
      };
      cur.qty += it.quantity;
      productCount.set(it.productId, cur);
    }
  }
  const topProduct =
    Array.from(productCount.values()).sort((a, b) => b.qty - a.qty)[0] ?? null;

  const cancelledOrRejected = totalOrdersAll - totalOrders;

  return (
    <div className="flex flex-col gap-5">
      {/* Back */}
      <Link
        href="/store/customers"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6B7280] hover:text-[#111827]"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        الرجوع للعملاء
      </Link>

      {/* Header card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-black ring-2",
            isVip
              ? "bg-[#FEF3C7] text-[#92400E] ring-[#FDE68A]"
              : isDormant
                ? "bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]"
                : "bg-[#DCFCE7] text-[#166534] ring-[#BBF7D0]"
          )}
        >
          {initialsFrom(customer.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-[#111827]">{customer.name}</h1>
            {isVip && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-black text-[#92400E] ring-1 ring-[#FDE68A]">
                <Trophy className="h-3 w-3" /> VIP
              </span>
            )}
            {isNew && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#DBEAFE] px-1.5 py-0.5 text-[10px] font-black text-[#1E40AF] ring-1 ring-[#BFDBFE]">
                <Sparkles className="h-3 w-3" /> جديد
              </span>
            )}
            {isDormant && (
              <span className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] font-black text-[#6B7280] ring-1 ring-[#E5E7EB]">
                خامل — {daysSinceLast} يوم بدون طلب
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-[#6B7280]">
            <span className="inline-flex items-center gap-1 font-mono tabular-nums" dir="ltr">
              {customer.phone}
            </span>
            <span>
              عميل من {format(customer.createdAt, "yyyy/MM/dd", { locale: arEG })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#16A34A] px-3 text-[12px] font-black text-white shadow-sm hover:bg-[#15803D]"
          >
            <MessageCircle className="h-4 w-4" />
            واتساب
          </a>
          <a
            href={telLink}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[12px] font-black text-[#0369A1] hover:bg-[#F0F9FF]"
          >
            <Phone className="h-4 w-4" />
            اتصال
          </a>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="طلبات محتسبة"
          value={totalOrders.toString()}
          hint={
            cancelledOrRejected > 0
              ? `${cancelledOrRejected} ملغي/مرفوض`
              : "بدون ملغيات"
          }
          icon={ShoppingBag}
          tone="brand"
        />
        <KpiCard
          label="إجمالي المصروف"
          value={formatEGP(totalSpent)}
          hint="من الطلبات المكتملة"
          icon={Wallet}
          tone="success"
        />
        <KpiCard
          label="متوسط الطلب"
          value={formatEGP(avgOrder)}
          hint={totalOrders > 0 ? `على مدار ${totalOrders} طلب` : "—"}
          icon={TrendingUp}
          tone="neutral"
        />
        <KpiCard
          label="آخر طلب"
          value={
            lastOrderAt
              ? formatDistanceToNow(lastOrderAt, { addSuffix: true, locale: arEG })
              : "—"
          }
          hint={
            daysSinceLast !== null ? `${daysSinceLast} يوم منذ آخر تعامل` : "لسه مفيش طلبات"
          }
          icon={Clock}
          tone={isDormant ? "warn" : "brand"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Orders list */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#F3F4F6] px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#6B7280]" />
                <div className="text-sm font-bold text-[#111827]">سجل الطلبات</div>
                <span className="rounded-full bg-[#F3F4F6] text-[#6B7280] text-[10px] font-bold px-2 py-0.5">
                  {orders.length}
                </span>
              </div>
              <div className="text-[11px] text-[#6B7280]">
                آخر 100 طلب
              </div>
            </div>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 text-[#9CA3AF]">
                <Inbox className="h-9 w-9" />
                <p className="text-sm font-semibold text-[#111827]">
                  لسه مفيش طلبات من العميل ده
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F3F4F6]">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="transition hover:bg-[#F8FAFC]"
                  >
                    <Link
                      href={`/store/orders/${o.id}`}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-[#111827]">
                            #{o.orderNumber}
                          </span>
                          <Badge
                            tone={orderStatusTone(o.status)}
                            className="text-[10px] font-bold"
                          >
                            {orderStatusLabel(o.status)}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#6B7280]">
                          <span>
                            {format(o.createdAt, "yyyy/MM/dd HH:mm", { locale: arEG })}
                          </span>
                          <span>·</span>
                          <span className="truncate">
                            {o.building?.name ?? "—"}
                            {o.address?.apartment
                              ? ` · شقة ${o.address.apartment}`
                              : ""}
                          </span>
                          <span>·</span>
                          <span>{o.items.length} صنف</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-sm font-black tabular-nums text-[#111827]">
                        {formatEGP(Number(o.total))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3">
          {/* Top product */}
          {topProduct && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                المنتج المفضل
              </div>
              <div className="mt-2 text-[13px] font-bold text-[#111827]">
                {topProduct.name}
              </div>
              <div className="mt-1 text-[11px] text-[#6B7280]">
                طلبها {topProduct.qty} مرة عبر جميع طلباته
              </div>
            </div>
          )}

          {/* Addresses */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="border-b border-[#F3F4F6] px-4 py-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#6B7280]" />
                <div className="text-sm font-bold text-[#111827]">العناوين</div>
                <span className="rounded-full bg-[#F3F4F6] text-[#6B7280] text-[10px] font-bold px-2 py-0.5">
                  {customer.addresses.length}
                </span>
              </div>
            </div>
            <div className="p-3">
              {customer.addresses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#F8FAFC] p-4 text-center text-[11px] text-[#6B7280]">
                  لا يوجد عناوين محفوظة
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {customer.addresses.map((a) => (
                    <li
                      key={a.id}
                      className={cn(
                        "rounded-lg border p-3 text-[11px] text-[#374151]",
                        a.isDefault
                          ? "border-[#BBF7D0] bg-[#F0FDF4]"
                          : "border-[#E5E7EB] bg-[#F8FAFC]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[12px] font-bold text-[#111827]">
                          {a.buildingName ?? "—"}
                        </div>
                        {a.isDefault && (
                          <span className="rounded bg-[#DCFCE7] px-1.5 py-0.5 text-[9px] font-black text-[#166534]">
                            افتراضي
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        {a.floor && <span>الدور: {a.floor}</span>}
                        {a.apartment && <span>الشقة: {a.apartment}</span>}
                        {a.street && <span>{a.street}</span>}
                      </div>
                      {a.deliveryNotes && (
                        <div className="mt-1.5 rounded bg-white/60 px-2 py-1 text-[10px] italic text-[#6B7280]">
                          ملاحظات: {a.deliveryNotes}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
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
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium text-[#6B7280]">{label}</div>
          <div
            className={cn(
              "mt-1.5 truncate text-2xl font-black tracking-tight tabular-nums",
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
