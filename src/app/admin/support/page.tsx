import Link from "next/link";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import type {
  Prisma,
  SupportTicketStatus,
  SupportTicketPriority,
} from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty";
import {
  supportStatusLabel,
  supportStatusTone,
  supportPriorityLabel,
  supportPriorityTone,
} from "@/lib/labels";
import { LifeBuoy, Search } from "lucide-react";

const STATUSES: SupportTicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const PRIORITIES: SupportTicketPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

type SearchParams = {
  status?: string;
  priority?: string;
  q?: string;
};

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const status =
    sp.status && (STATUSES as string[]).includes(sp.status)
      ? (sp.status as SupportTicketStatus)
      : undefined;
  const priority =
    sp.priority && (PRIORITIES as string[]).includes(sp.priority)
      ? (sp.priority as SupportTicketPriority)
      : undefined;
  const q = sp.q?.trim() ?? "";

  const where: Prisma.SupportTicketWhereInput = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (q.length > 0) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
      { store: { name: { contains: q, mode: "insensitive" } } },
      { store: { nameAr: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [tickets, counts] = await Promise.all([
    db.supportTicket.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        store: { select: { id: true, name: true, nameAr: true } },
        user: { select: { id: true, name: true, email: true } },
        assignedAdmin: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
      take: 200,
    }),
    db.supportTicket.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const totalByStatus: Record<string, number> = {};
  for (const row of counts) {
    totalByStatus[row.status] = row._count._all;
  }

  function buildHref(patch: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      status: sp.status,
      priority: sp.priority,
      q: sp.q,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v.length > 0) p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `/admin/support?${qs}` : "/admin/support";
  }

  const stats = [
    { label: "مفتوحة", value: totalByStatus.OPEN ?? 0, tone: "text-yellow-700", bg: "bg-yellow-50" },
    { label: "قيد المعالجة", value: totalByStatus.IN_PROGRESS ?? 0, tone: "text-blue-700", bg: "bg-blue-50" },
    { label: "تم الحل", value: totalByStatus.RESOLVED ?? 0, tone: "text-green-700", bg: "bg-green-50" },
    { label: "مغلقة", value: totalByStatus.CLOSED ?? 0, tone: "text-gray-700", bg: "bg-gray-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تذاكر الدعم</h1>
        <p className="text-sm text-gray-500">
          إدارة تذاكر الدعم المرسلة من البقالات
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className={s.bg}>
            <CardContent className="p-4">
              <div className="text-xs text-gray-600">{s.label}</div>
              <div className={`mt-1 text-xl font-bold ${s.tone}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>كل التذاكر ({tickets.length})</CardTitle>
            <form
              method="get"
              action="/admin/support"
              className="flex items-center gap-2"
            >
              {status && <input type="hidden" name="status" value={status} />}
              {priority && (
                <input type="hidden" name="priority" value={priority} />
              )}
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="ابحث بالموضوع أو البقالة"
                  className="w-64 ps-9"
                />
              </div>
            </form>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500">الحالة:</span>
              <Link
                href={buildHref({ status: undefined })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  !status
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                الكل
              </Link>
              {STATUSES.map((s) => (
                <Link
                  key={s}
                  href={buildHref({ status: s })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    status === s
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {supportStatusLabel(s)}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500">الأولوية:</span>
              <Link
                href={buildHref({ priority: undefined })}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  !priority
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                الكل
              </Link>
              {PRIORITIES.map((p) => (
                <Link
                  key={p}
                  href={buildHref({ priority: p })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    priority === p
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {supportPriorityLabel(p)}
                </Link>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<LifeBuoy className="h-6 w-6" />}
                title="مفيش تذاكر"
                description="لسه مفيش تذاكر دعم مطابقة للفلتر."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">الرقم</th>
                    <th className="px-4 py-3 font-medium">الموضوع</th>
                    <th className="px-4 py-3 font-medium">البقالة</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">الأولوية</th>
                    <th className="px-4 py-3 font-medium">الرسائل</th>
                    <th className="px-4 py-3 font-medium">المسؤول</th>
                    <th className="px-4 py-3 font-medium">آخر تحديث</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {t.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link
                          href={`/admin/support/${t.id}`}
                          className="hover:text-green-700"
                        >
                          {t.subject}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {t.store
                          ? (t.store.nameAr ?? t.store.name)
                          : t.user?.name ?? t.user?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={supportStatusTone(t.status)}>
                          {supportStatusLabel(t.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={supportPriorityTone(t.priority)}>
                          {supportPriorityLabel(t.priority)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {t._count.messages}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {t.assignedAdmin?.name ??
                          t.assignedAdmin?.email ??
                          "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {format(t.updatedAt, "yyyy/MM/dd HH:mm", {
                          locale: arEG,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/support/${t.id}`}
                          className="text-sm font-medium text-green-700 hover:underline"
                        >
                          فتح
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
