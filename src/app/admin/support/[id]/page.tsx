import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  supportStatusLabel,
  supportStatusTone,
  supportPriorityLabel,
  supportPriorityTone,
} from "@/lib/labels";
import {
  SupportTicketReplyForm,
  SupportTicketStatusControl,
  SupportTicketPriorityControl,
} from "./_actions";

export default async function AdminSupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true, nameAr: true, phone: true, email: true } },
      user: { select: { id: true, name: true, email: true } },
      assignedAdmin: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!ticket) notFound();

  const submitterName =
    ticket.store?.nameAr ??
    ticket.store?.name ??
    ticket.user?.name ??
    ticket.user?.email ??
    "غير معروف";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/support"
            className="text-xs text-gray-500 hover:text-green-700"
          >
            ← الرجوع للتذاكر
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {ticket.subject}
          </h1>
          <p className="text-sm text-gray-500">
            تذكرة #{ticket.id.slice(0, 8)} —{" "}
            {ticket.store ? (
              <Link
                href={`/admin/stores/${ticket.store.id}`}
                className="hover:text-green-700"
              >
                {submitterName}
              </Link>
            ) : (
              submitterName
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={supportPriorityTone(ticket.priority)}>
            {supportPriorityLabel(ticket.priority)}
          </Badge>
          <Badge tone={supportStatusTone(ticket.status)}>
            {supportStatusLabel(ticket.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>المحادثة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MessageBubble
                authorRole="STORE"
                authorLabel={submitterName}
                body={ticket.message}
                createdAt={ticket.createdAt}
              />
              {ticket.messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  authorRole={m.authorRole}
                  authorLabel={
                    m.authorRole === "ADMIN"
                      ? (m.author?.name ?? m.author?.email ?? "الدعم")
                      : submitterName
                  }
                  body={m.body}
                  createdAt={m.createdAt}
                />
              ))}
              {ticket.messages.length === 0 && (
                <p className="text-xs text-gray-500">
                  لسه مفيش ردود على التذكرة.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إرسال رد</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.status === "CLOSED" ? (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  التذكرة مغلقة — غيّر الحالة عشان تقدر ترد.
                </div>
              ) : (
                <SupportTicketReplyForm id={ticket.id} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل التذكرة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="مقدم التذكرة" value={submitterName} />
              {ticket.store?.phone && (
                <Row label="هاتف البقالة" value={ticket.store.phone} />
              )}
              {ticket.store?.email && (
                <Row label="إيميل البقالة" value={ticket.store.email} />
              )}
              {ticket.user?.email && !ticket.store?.email && (
                <Row label="إيميل المستخدم" value={ticket.user.email} />
              )}
              <Row
                label="المسؤول"
                value={
                  ticket.assignedAdmin?.name ??
                  ticket.assignedAdmin?.email ??
                  "غير معيّن"
                }
              />
              <Row
                label="تاريخ الإنشاء"
                value={format(ticket.createdAt, "yyyy/MM/dd HH:mm", {
                  locale: arEG,
                })}
              />
              <Row
                label="آخر تحديث"
                value={format(ticket.updatedAt, "yyyy/MM/dd HH:mm", {
                  locale: arEG,
                })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الإجراءات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SupportTicketStatusControl
                id={ticket.id}
                status={ticket.status}
              />
              <SupportTicketPriorityControl
                id={ticket.id}
                priority={ticket.priority}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-1.5 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function MessageBubble({
  authorRole,
  authorLabel,
  body,
  createdAt,
}: {
  authorRole: "STORE" | "ADMIN";
  authorLabel: string;
  body: string;
  createdAt: Date;
}) {
  const isAdmin = authorRole === "ADMIN";
  return (
    <div className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isAdmin
            ? "bg-green-50 text-gray-900"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
          <span className="font-semibold">
            {isAdmin ? "الدعم" : "البقال"}
          </span>
          <span>·</span>
          <span>{authorLabel}</span>
          <span>·</span>
          <span>
            {format(createdAt, "yyyy/MM/dd HH:mm", { locale: arEG })}
          </span>
        </div>
        <div className="whitespace-pre-wrap leading-relaxed">{body}</div>
      </div>
    </div>
  );
}
