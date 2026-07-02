"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import {
  Building2,
  Search,
  Plus,
  X,
  Power,
  PowerOff,
  Trash2,
  QrCode,
  Download,
  Printer,
  Copy,
  Pencil,
  MapPin,
  ShoppingBag,
  Users,
  TrendingUp,
  ScanLine,
  Info,
} from "lucide-react";
import {
  createBuilding,
  updateBuilding,
  toggleBuildingActive,
  deleteBuilding,
} from "@/server/actions/store";
import { formatEGP, cn } from "@/lib/utils";

export type BuildingRow = {
  id: string;
  name: string;
  code: string;
  areaName: string | null;
  street: string | null;
  buildingNumber: string | null;
  compoundName: string | null;
  isActive: boolean;
  deliveryFee: number | null;
  qrCount: number;
  qrCode: string | null;
  qrUrl: string | null;
  totalScans: number;
  lastScannedAt: string | null;
  orders: number;
  revenue: number;
  lastOrderAt: string | null;
  customers: number;
};

type Segment = "all" | "active" | "inactive" | "hot" | "cold";

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "active", label: "نشطة" },
  { key: "hot", label: "أكثر طلبات" },
  { key: "cold", label: "بدون طلبات" },
  { key: "inactive", label: "موقوفة" },
];

type FormValues = {
  id?: string;
  name: string;
  street: string;
  buildingNumber: string;
  compoundName: string;
  deliveryFee: string;
};

const EMPTY_FORM: FormValues = {
  id: undefined,
  name: "",
  street: "",
  buildingNumber: "",
  compoundName: "",
  deliveryFee: "",
};

export function BuildingsClient({ buildings }: { buildings: BuildingRow[] }) {
  const [editing, setEditing] = useState<null | FormValues>(null);
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState<Segment>("all");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: EMPTY_FORM,
  });

  const counts = useMemo(() => {
    const active = buildings.filter((b) => b.isActive).length;
    const inactive = buildings.length - active;
    const hot = buildings.filter((b) => b.orders >= 5).length;
    const cold = buildings.filter((b) => b.orders === 0).length;
    return { all: buildings.length, active, inactive, hot, cold };
  }, [buildings]);

  const totals = useMemo(() => {
    const orders = buildings.reduce((s, b) => s + b.orders, 0);
    const revenue = buildings.reduce((s, b) => s + b.revenue, 0);
    const scans = buildings.reduce((s, b) => s + b.totalScans, 0);
    const customers = buildings.reduce((s, b) => s + b.customers, 0);
    const top = [...buildings]
      .filter((b) => b.orders > 0)
      .sort((a, b) => b.orders - a.orders)[0];
    return { orders, revenue, scans, customers, top };
  }, [buildings]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return buildings
      .filter((b) => {
        if (seg === "active") return b.isActive;
        if (seg === "inactive") return !b.isActive;
        if (seg === "hot") return b.orders >= 5;
        if (seg === "cold") return b.orders === 0;
        return true;
      })
      .filter((b) => {
        if (!needle) return true;
        return (
          b.name.toLowerCase().includes(needle) ||
          b.code.toLowerCase().includes(needle) ||
          (b.street ?? "").toLowerCase().includes(needle) ||
          (b.compoundName ?? "").toLowerCase().includes(needle) ||
          (b.areaName ?? "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        // Active first, then by orders desc, then by scans desc
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        if (b.orders !== a.orders) return b.orders - a.orders;
        return b.totalScans - a.totalScans;
      });
  }, [buildings, q, seg]);

  const openNew = () => {
    reset(EMPTY_FORM);
    setEditing({ ...EMPTY_FORM });
  };

  const openEdit = (b: BuildingRow) => {
    const values: FormValues = {
      id: b.id,
      name: b.name,
      street: b.street ?? "",
      buildingNumber: b.buildingNumber ?? "",
      compoundName: b.compoundName ?? "",
      deliveryFee: b.deliveryFee != null ? String(b.deliveryFee) : "",
    };
    reset(values);
    setEditing(values);
  };

  const closeForm = () => {
    reset(EMPTY_FORM);
    setEditing(null);
  };

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const payload = {
        name: values.name,
        street: values.street,
        buildingNumber: values.buildingNumber,
        compoundName: values.compoundName,
        deliveryFee: values.deliveryFee ? Number(values.deliveryFee) : null,
      };
      const res = values.id
        ? await updateBuilding(values.id, payload)
        : await createBuilding(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(values.id ? "تم تعديل العمارة" : "تم إضافة العمارة");
      closeForm();
    });
  };

  const onToggle = (b: BuildingRow) => {
    setBusyId(b.id);
    startTransition(async () => {
      const res = await toggleBuildingActive(b.id);
      setBusyId(null);
      if (!res.ok) toast.error(res.error);
      else toast.success(b.isActive ? "تم إيقاف العمارة" : "تم تفعيل العمارة");
    });
  };

  const onDelete = (b: BuildingRow) => {
    if (!confirm(`تحذف عمارة "${b.name}"؟`)) return;
    setBusyId(b.id);
    startTransition(async () => {
      const res = await deleteBuilding(b.id);
      setBusyId(null);
      if (!res.ok) toast.error(res.error);
      else toast.success("تم حذف العمارة");
    });
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("فشل نسخ الرابط");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#111827]">العمارات</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            متابعة عمارات التوصيل وأداء QR الخاص بكل عمارة
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16A34A] px-3 py-2 text-[12px] font-black text-white shadow-sm transition hover:bg-[#15803D]"
          >
            <Plus className="h-4 w-4" />
            <span>عمارة جديدة</span>
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-3 shadow-sm">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#1E40AF]">
          <Info className="h-4 w-4" />
        </div>
        <div className="flex-1 text-[12px] leading-relaxed text-[#1E3A8A]">
          <div className="font-black">إدارة العمارات والأكواد</div>
          <div className="mt-0.5 text-[#1E40AF]">
            تقدر تضيف عمارات جديدة للبقالة وتفعّلها، وكل عمارة بيتولد ليها كود QR
            تلقائي. المسؤول العام على المنصة هيراجع العمارات على المستوى العام
            ويتحكم في المناطق والمحافظات.
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="إجمالي العمارات"
          value={counts.all.toString()}
          hint={`${counts.active} نشطة · ${counts.inactive} موقوفة`}
          icon={Building2}
          tone="neutral"
        />
        <KpiCard
          label="طلبات من العمارات"
          value={totals.orders.toString()}
          hint={
            totals.top
              ? `الأكثر: ${totals.top.name} (${totals.top.orders})`
              : "لسه مفيش طلبات"
          }
          icon={ShoppingBag}
          tone="brand"
        />
        <KpiCard
          label="إجمالي المبيعات"
          value={formatEGP(totals.revenue)}
          hint={`${totals.customers} عميل من العمارات`}
          icon={TrendingUp}
          tone="success"
        />
        <KpiCard
          label="مسحات QR"
          value={totals.scans.toString()}
          hint={
            counts.hot > 0
              ? `${counts.hot} عمارة نشيطة بالطلبات`
              : "شجّع السكان يمسحوا الكود"
          }
          icon={ScanLine}
          tone="warn"
        />
      </div>

      {/* Create/edit form */}
      {editing && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#166534]" />
              <div className="text-sm font-bold text-[#166534]">
                {editing.id ? "تعديل العمارة" : "إضافة عمارة جديدة"}
              </div>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md p-1 text-[#6B7280] transition hover:bg-white hover:text-[#111827]"
              aria-label="إلغاء"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field
              id="bname"
              label="اسم العمارة"
              placeholder="مثال: عمارة النور"
              register={register("name", { required: true, minLength: 2 })}
              error={formState.errors.name && "اسم العمارة مطلوب"}
            />
            <Field
              id="bnumber"
              label="رقم العمارة"
              placeholder="12"
              register={register("buildingNumber")}
              dir="ltr"
            />
            <Field
              id="bstreet"
              label="الشارع"
              placeholder="شارع الحرية"
              register={register("street")}
            />
            <Field
              id="bcompound"
              label="اسم الكمبوند / المنطقة"
              placeholder="اختياري"
              register={register("compoundName")}
            />
            <Field
              id="bfee"
              label="رسوم توصيل خاصة بالعمارة (اختياري)"
              placeholder="اتركها فاضية لو نفس رسوم البقالة"
              register={register("deliveryFee")}
              type="number"
              dir="ltr"
            />
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[12px] font-bold text-[#374151] transition hover:bg-[#F8FAFC]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#16A34A] px-4 text-[12px] font-black text-white shadow-sm transition hover:bg-[#15803D] disabled:opacity-60"
            >
              {editing.id ? (
                <>
                  <Pencil className="h-4 w-4" />
                  {pending ? "جاري الحفظ..." : "حفظ التعديلات"}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {pending ? "جاري الحفظ..." : "إضافة العمارة"}
                </>
              )}
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
            placeholder="ابحث بالاسم، الكود، الشارع، أو المنطقة..."
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

      {/* Buildings list */}
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-[#9CA3AF]">
            <Building2 className="h-10 w-10" />
            <div className="text-center">
              <p className="text-sm font-semibold text-[#111827]">
                {buildings.length === 0
                  ? "لسه مفيش عمارات"
                  : "مفيش عمارات مطابقة للبحث"}
              </p>
              <p className="mt-1 text-xs">
                {buildings.length === 0
                  ? "ابدأ بإضافة أول عمارة علشان تتولد ليها QR وتقدر توصل السكان"
                  : "غير الفلتر أو الكلمة اللي بتبحث بيها"}
              </p>
            </div>
            {buildings.length === 0 && !editing && (
              <button
                type="button"
                onClick={openNew}
                className="mt-1 inline-flex items-center gap-2 rounded-lg bg-[#16A34A] px-3 py-2 text-[12px] font-black text-white shadow-sm transition hover:bg-[#15803D]"
              >
                <Plus className="h-4 w-4" />
                إضافة عمارة
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[#F3F4F6]">
            {filtered.map((b) => {
              const isHot = b.orders >= 5;
              const isCold = b.orders === 0;
              return (
                <li
                  key={b.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 px-3 py-3 transition sm:flex-nowrap",
                    b.isActive ? "hover:bg-[#F8FAFC]" : "bg-[#F8FAFC]/60 opacity-90"
                  )}
                >
                  {/* Building icon block */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ring-2",
                        !b.isActive
                          ? "bg-[#F3F4F6] text-[#6B7280] ring-[#E5E7EB]"
                          : isHot
                            ? "bg-[#FEF3C7] text-[#92400E] ring-[#FDE68A]"
                            : "bg-[#DCFCE7] text-[#166534] ring-[#BBF7D0]"
                      )}
                    >
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full ring-2 ring-white",
                        !b.isActive
                          ? "bg-[#9CA3AF]"
                          : isHot
                            ? "bg-[#F59E0B]"
                            : "bg-[#16A34A]"
                      )}
                      aria-hidden
                    />
                  </div>

                  {/* Info block */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-[13px] font-bold text-[#111827]">
                        {b.name}
                      </span>
                      <span className="font-mono text-[10px] font-black tracking-wider text-[#16A34A] rounded bg-[#DCFCE7] px-1.5 py-0.5 ring-1 ring-[#BBF7D0]">
                        {b.code}
                      </span>
                      {!b.isActive && (
                        <span className="rounded-md bg-[#FEE2E2] px-1.5 py-0.5 text-[9px] font-black text-[#991B1B] ring-1 ring-[#FECACA]">
                          موقوفة
                        </span>
                      )}
                      {isHot && b.isActive && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-1.5 py-0.5 text-[9px] font-black text-[#92400E] ring-1 ring-[#FDE68A]">
                          نشيطة
                        </span>
                      )}
                      {isCold && b.isActive && (
                        <span className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5 text-[9px] font-black text-[#6B7280] ring-1 ring-[#E5E7EB]">
                          بدون طلبات
                        </span>
                      )}
                      {b.deliveryFee != null && (
                        <span className="rounded-md bg-[#DBEAFE] px-1.5 py-0.5 text-[9px] font-black text-[#1E40AF] ring-1 ring-[#BFDBFE]">
                          رسوم خاصة: {formatEGP(b.deliveryFee)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6B7280]">
                      {(b.street || b.buildingNumber) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {b.street ?? ""}
                            {b.buildingNumber ? ` — رقم ${b.buildingNumber}` : ""}
                          </span>
                        </span>
                      )}
                      {b.compoundName && (
                        <>
                          <span>·</span>
                          <span className="truncate">{b.compoundName}</span>
                        </>
                      )}
                      {b.areaName && (
                        <>
                          <span>·</span>
                          <span>{b.areaName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 border-s border-[#F3F4F6] ps-3">
                    <Stat
                      label="طلبات"
                      value={b.orders}
                      icon={ShoppingBag}
                      highlight={b.orders > 0}
                    />
                    <Stat
                      label="مبيعات"
                      value={formatEGP(b.revenue)}
                      icon={TrendingUp}
                      mono
                    />
                    <Stat label="عملاء" value={b.customers} icon={Users} />
                    <Stat
                      label="مسحات"
                      value={b.totalScans}
                      icon={ScanLine}
                    />
                    {b.lastOrderAt && (
                      <div className="hidden flex-col items-end lg:flex">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                          آخر طلب
                        </div>
                        <div className="text-[10px] font-bold text-[#374151]">
                          {formatDistanceToNow(new Date(b.lastOrderAt), {
                            addSuffix: true,
                            locale: arEG,
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    {b.qrCode && (
                      <>
                        <Link
                          href={`/api/store/qr/${b.qrCode}/download`}
                          target="_blank"
                          title="تحميل QR"
                          aria-label="تحميل QR"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#0369A1] transition hover:bg-[#F0F9FF]"
                        >
                          <Download className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/api/store/qr/${b.qrCode}/poster`}
                          target="_blank"
                          title="طباعة بوستر"
                          aria-label="طباعة بوستر"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#166534] transition hover:bg-[#F0FDF4]"
                        >
                          <Printer className="h-4 w-4" />
                        </Link>
                        {b.qrUrl && (
                          <button
                            type="button"
                            onClick={() => copyLink(b.qrUrl!)}
                            title="نسخ رابط الطلب"
                            aria-label="نسخ رابط الطلب"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] transition hover:bg-[#F8FAFC]"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                    {!b.qrCode && (
                      <span
                        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[#FECACA] bg-[#FEF2F2] px-2 py-1.5 text-[10px] font-black text-[#991B1B]"
                        title="QR غير متوفر"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        بدون QR
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      title="تعديل"
                      aria-label="تعديل"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] transition hover:bg-[#F8FAFC]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggle(b)}
                      disabled={pending && busyId === b.id}
                      title={b.isActive ? "إيقاف العمارة" : "تفعيل العمارة"}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-black transition disabled:opacity-60",
                        b.isActive
                          ? "border-[#FECACA] bg-white text-[#DC2626] hover:bg-[#FEF2F2]"
                          : "border-[#BBF7D0] bg-white text-[#166534] hover:bg-[#F0FDF4]"
                      )}
                    >
                      {b.isActive ? (
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
                    {b.orders === 0 && (
                      <button
                        type="button"
                        onClick={() => onDelete(b)}
                        disabled={pending && busyId === b.id}
                        title="حذف"
                        aria-label="حذف"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#FECACA] bg-white text-[#DC2626] transition hover:bg-[#FEF2F2] disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
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
  icon: Icon,
  highlight,
  mono,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="hidden flex-col items-end sm:flex">
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div
        className={cn(
          "text-sm font-black leading-none tabular-nums",
          mono ? "font-mono" : "",
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
  register: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
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
