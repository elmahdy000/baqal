"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import {
  Plus,
  X,
  Search,
  Bike,
  MessageCircle,
  Phone,
  Power,
  PowerOff,
  Package,
  CheckCircle2,
  Trophy,
  UserPlus,
} from "lucide-react";
import { createDriver, toggleDriverActive } from "@/server/actions/store";
import { cn } from "@/lib/utils";

type Driver = {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  activeCount: number;
  deliveredToday: number;
  deliveredTotal: number;
  lastDeliveredAt: string | null;
};

type Values = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

type Segment = "all" | "active" | "inactive" | "busy" | "idle";

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "active", label: "نشطون" },
  { key: "busy", label: "على طلبات" },
  { key: "idle", label: "متاح" },
  { key: "inactive", label: "موقوفون" },
];

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

export function DriversClient({ drivers }: { drivers: Driver[] }) {
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState<Segment>("all");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<Values>({
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  const counts = useMemo(
    () => ({
      all: drivers.length,
      active: drivers.filter((d) => d.isActive).length,
      inactive: drivers.filter((d) => !d.isActive).length,
      busy: drivers.filter((d) => d.isActive && d.activeCount > 0).length,
      idle: drivers.filter((d) => d.isActive && d.activeCount === 0).length,
    }),
    [drivers]
  );

  // Aggregate KPIs
  const totals = useMemo(() => {
    const activeDeliveries = drivers.reduce((s, d) => s + d.activeCount, 0);
    const deliveredToday = drivers.reduce((s, d) => s + d.deliveredToday, 0);
    const topDriver = [...drivers].sort((a, b) => b.deliveredToday - a.deliveredToday)[0];
    return { activeDeliveries, deliveredToday, topDriver };
  }, [drivers]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return drivers
      .filter((d) => {
        if (seg === "active") return d.isActive;
        if (seg === "inactive") return !d.isActive;
        if (seg === "busy") return d.isActive && d.activeCount > 0;
        if (seg === "idle") return d.isActive && d.activeCount === 0;
        return true;
      })
      .filter((d) => {
        if (!needle) return true;
        return (
          d.name.toLowerCase().includes(needle) ||
          d.email.toLowerCase().includes(needle) ||
          d.phone.includes(needle)
        );
      })
      .sort((a, b) => {
        // Busy active drivers first, then idle active, then inactive.
        const rank = (d: Driver) =>
          d.isActive ? (d.activeCount > 0 ? 0 : 1) : 2;
        const r = rank(a) - rank(b);
        if (r !== 0) return r;
        return b.deliveredToday - a.deliveredToday;
      });
  }, [drivers, q, seg]);

  const onCreate = (values: Values) => {
    startTransition(async () => {
      const res = await createDriver(values);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("تم إضافة السائق");
        reset();
        setCreating(false);
      }
    });
  };

  const onToggle = (d: Driver) => {
    setBusyId(d.id);
    startTransition(async () => {
      const res = await toggleDriverActive(d.id);
      setBusyId(null);
      if (!res.ok) toast.error(res.error);
      else toast.success(d.isActive ? "تم إيقاف السائق" : "تم تفعيل السائق");
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">السائقين</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            متابعة سائقي التوصيل والطلبات الجارية معهم
          </p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] px-3 py-2 text-[12px] font-black text-white shadow-sm transition hover:bg-[#15803D]"
          >
            <UserPlus className="h-4 w-4" />
            <span>سائق جديد</span>
          </button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="إجمالي السائقين"
          value={counts.all.toString()}
          hint={`${counts.active} نشط · ${counts.inactive} موقوف`}
          icon={Bike}
          tone="neutral"
        />
        <KpiCard
          label="على طلبات دلوقتي"
          value={counts.busy.toString()}
          hint={`${counts.idle} سائق متاح`}
          icon={Package}
          tone="warn"
        />
        <KpiCard
          label="طلبات جارية"
          value={totals.activeDeliveries.toString()}
          hint="موزعة على السائقين"
          icon={Package}
          tone="brand"
        />
        <KpiCard
          label="اتوصل النهارده"
          value={totals.deliveredToday.toString()}
          hint={
            totals.topDriver && totals.topDriver.deliveredToday > 0
              ? `الأول: ${totals.topDriver.name || "بدون اسم"}`
              : "لسه محدش وصل النهارده"
          }
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {/* Create form */}
      {creating && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#166534]" />
              <div className="text-sm font-bold text-[#166534]">
                إضافة سائق جديد
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                reset();
              }}
              className="rounded-md p-1 text-[#6B7280] transition hover:bg-white hover:text-[#111827]"
              aria-label="إلغاء"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field
              id="dname"
              label="الاسم"
              placeholder="مثال: أحمد محمد"
              register={register("name", { required: true })}
              error={formState.errors.name && "الاسم مطلوب"}
            />
            <Field
              id="demail"
              label="البريد الإلكتروني"
              type="email"
              placeholder="ahmed@example.com"
              register={register("email", { required: true })}
              error={formState.errors.email && "البريد مطلوب"}
              dir="ltr"
            />
            <Field
              id="dphone"
              label="رقم الموبايل"
              placeholder="01xxxxxxxxx"
              register={register("phone")}
              dir="ltr"
            />
            <Field
              id="dpass"
              label="كلمة السر"
              type="password"
              placeholder="6 حروف على الأقل"
              register={register("password", { required: true, minLength: 6 })}
              error={
                formState.errors.password &&
                (formState.errors.password.type === "minLength"
                  ? "6 حروف على الأقل"
                  : "كلمة السر مطلوبة")
              }
              dir="ltr"
            />
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                reset();
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[12px] font-bold text-[#374151] transition hover:bg-[#F8FAFC]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#16A34A] px-4 text-[12px] font-black text-white shadow-sm transition hover:bg-[#15803D] disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {pending ? "جاري الحفظ..." : "إضافة السائق"}
            </button>
          </div>
        </form>
      )}

      {/* Search + segments */}
      <div className="flex flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالاسم، الإيميل، أو الموبايل..."
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 pe-10 text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition focus:border-[#16A34A] focus:bg-white focus:ring-2 focus:ring-[#DCFCE7]"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {SEGMENTS.map((s) => {
            const active = seg === s.key;
            const n = counts[s.key];
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSeg(s.key)}
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Drivers list */}
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-[#9CA3AF]">
            <Bike className="h-9 w-9" />
            <p className="text-sm font-semibold text-[#111827]">
              {drivers.length === 0
                ? "لسه مفيش سائقين"
                : "مفيش سائقين مطابقين للبحث"}
            </p>
            <p className="text-xs">
              {drivers.length === 0
                ? "ابدأ بإضافة أول سائق للبقالة"
                : "غير الفلتر أو الكلمة اللي بتبحث بيها"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F3F4F6]">
            {filtered.map((d) => {
              const isBusy = d.isActive && d.activeCount > 0;
              const phoneIntl = d.phone ? normalizeEgyptPhone(d.phone) : null;
              return (
                <li
                  key={d.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 px-3 py-3 transition sm:flex-nowrap",
                    d.isActive ? "hover:bg-[#F8FAFC]" : "bg-[#F8FAFC]/60 opacity-90"
                  )}
                >
                  {/* Avatar with status ring */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full text-xs font-black shadow-sm ring-2",
                        !d.isActive
                          ? "bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]"
                          : isBusy
                            ? "bg-[#FEF3C7] text-[#92400E] ring-[#FDE68A]"
                            : "bg-[#DCFCE7] text-[#166534] ring-[#BBF7D0]"
                      )}
                    >
                      {initialsFrom(d.name || d.email)}
                    </div>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full ring-2 ring-white",
                        !d.isActive
                          ? "bg-[#9CA3AF]"
                          : isBusy
                            ? "bg-[#F59E0B]"
                            : "bg-[#16A34A]"
                      )}
                      aria-hidden
                    />
                  </div>

                  {/* Name + contact */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-[13px] font-bold text-[#111827]">
                        {d.name || "بدون اسم"}
                      </span>
                      {!d.isActive && (
                        <span className="rounded-md bg-[#FEE2E2] px-1.5 py-0.5 text-[9px] font-black text-[#991B1B] ring-1 ring-[#FECACA]">
                          موقوف
                        </span>
                      )}
                      {isBusy && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-1.5 py-0.5 text-[9px] font-black text-[#92400E] ring-1 ring-[#FDE68A]">
                          <Package className="h-2.5 w-2.5" />
                          {d.activeCount} جاري
                        </span>
                      )}
                      {d.isActive && !isBusy && (
                        <span className="rounded-md bg-[#DCFCE7] px-1.5 py-0.5 text-[9px] font-black text-[#166534] ring-1 ring-[#BBF7D0]">
                          متاح
                        </span>
                      )}
                      {d.deliveredToday >= 5 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#DBEAFE] px-1.5 py-0.5 text-[9px] font-black text-[#1E40AF] ring-1 ring-[#BFDBFE]">
                          <Trophy className="h-2.5 w-2.5" />
                          يوم قوي
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6B7280]">
                      <span className="truncate font-mono" dir="ltr">
                        {d.email}
                      </span>
                      {d.phone && (
                        <>
                          <span>·</span>
                          <span className="font-mono tabular-nums" dir="ltr">
                            {d.phone}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 border-s border-[#F3F4F6] ps-3">
                    <Stat label="النهارده" value={d.deliveredToday} highlight />
                    <Stat label="إجمالي" value={d.deliveredTotal} />
                    {d.lastDeliveredAt && (
                      <div className="hidden flex-col items-end md:flex">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                          آخر توصيل
                        </div>
                        <div className="text-[10px] font-bold text-[#374151]">
                          {formatDistanceToNow(new Date(d.lastDeliveredAt), {
                            addSuffix: true,
                            locale: arEG,
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    {phoneIntl && (
                      <>
                        <a
                          href={`https://wa.me/${phoneIntl.replace("+", "")}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="واتساب"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#16A34A] transition hover:bg-[#F0FDF4]"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                        <a
                          href={`tel:${phoneIntl}`}
                          aria-label="اتصال"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#0369A1] transition hover:bg-[#F0F9FF]"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggle(d)}
                      disabled={pending && busyId === d.id}
                      title={d.isActive ? "إيقاف السائق" : "تفعيل السائق"}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-black transition disabled:opacity-60",
                        d.isActive
                          ? "border-[#FECACA] bg-white text-[#DC2626] hover:bg-[#FEF2F2]"
                          : "border-[#BBF7D0] bg-white text-[#166534] hover:bg-[#F0FDF4]"
                      )}
                    >
                      {d.isActive ? (
                        <>
                          <PowerOff className="h-3.5 w-3.5" />
                          إيقاف
                        </>
                      ) : (
                        <>
                          <Power className="h-3.5 w-3.5" />
                          تفعيل
                        </>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-end">
      <div className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
        {label}
      </div>
      <div
        className={cn(
          "text-sm font-black tabular-nums leading-none",
          highlight ? "text-[#15803D]" : "text-[#111827]"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  register,
  type = "text",
  placeholder,
  error,
  dir,
}: {
  id: string;
  label: string;
  register: ReturnType<ReturnType<typeof useForm<Values>>["register"]>;
  type?: string;
  placeholder?: string;
  error?: string | false;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-bold text-[#374151]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        dir={dir}
        {...register}
        className={cn(
          "h-10 rounded-lg border bg-white px-3 text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none transition",
          error
            ? "border-[#FECACA] focus:border-[#DC2626] focus:ring-2 focus:ring-[#FEE2E2]"
            : "border-[#E5E7EB] focus:border-[#16A34A] focus:ring-2 focus:ring-[#DCFCE7]"
        )}
      />
      {error && (
        <span className="text-[10px] font-bold text-[#DC2626]">{error}</span>
      )}
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
