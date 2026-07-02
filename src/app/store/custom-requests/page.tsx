import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReplyForm } from "./_components/reply-form";
import { Phone, User as UserIcon } from "lucide-react";
import type { CustomRequestStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<CustomRequestStatus, string> = {
  PENDING: "قيد الرد",
  ANSWERED_AVAILABLE: "موجود",
  ANSWERED_UNAVAILABLE: "مش موجود",
  ANSWERED_SOON: "هجيبهولك",
};

const STATUS_TONE: Record<
  CustomRequestStatus,
  "yellow" | "green" | "red" | "blue"
> = {
  PENDING: "yellow",
  ANSWERED_AVAILABLE: "green",
  ANSWERED_UNAVAILABLE: "red",
  ANSWERED_SOON: "blue",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CustomRequestsPage() {
  const user = await requireStore();

  const requests = await db.customRequest.findMany({
    where: { storeId: user.storeId },
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = requests.filter((r) => r.status === "PENDING");
  const answered = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">طلبات مخصصة</h1>
        <p className="text-sm text-gray-500">
          العملاء بيطلبوا منتجات مش موجودة في البقالة
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-gray-500">
            لسه مفيش طلبات مخصصة
          </CardContent>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-600 mb-2">
                قيد الرد ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {r.customer.name}
                            </div>
                            <a
                              href={`tel:${r.customer.phone}`}
                              className="text-xs text-green-700 flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3" />
                              {r.customer.phone}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge tone={STATUS_TONE[r.status]}>
                            {STATUS_LABEL[r.status]}
                          </Badge>
                          <span>{formatDate(r.createdAt)}</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
                        {r.text}
                      </div>
                      <ReplyForm requestId={r.id} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {answered.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-600 mb-2">
                تم الرد ({answered.length})
              </h2>
              <div className="space-y-3">
                {answered.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {r.customer.name}
                            </div>
                            <a
                              href={`tel:${r.customer.phone}`}
                              className="text-xs text-green-700 flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3" />
                              {r.customer.phone}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge tone={STATUS_TONE[r.status]}>
                            {STATUS_LABEL[r.status]}
                          </Badge>
                          <span>{formatDate(r.createdAt)}</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
                        <div className="text-xs text-gray-500 mb-1">الطلب</div>
                        {r.text}
                      </div>
                      {r.reply && (
                        <div className="rounded-lg bg-green-50 p-3 text-sm text-gray-800">
                          <div className="text-xs text-green-700 mb-1">الرد</div>
                          {r.reply}
                        </div>
                      )}
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer">
                          تعديل الرد
                        </summary>
                        <div className="pt-3">
                          <ReplyForm
                            requestId={r.id}
                            initialReply={r.reply ?? ""}
                            initialStatus={
                              r.status === "PENDING"
                                ? "ANSWERED_AVAILABLE"
                                : r.status
                            }
                          />
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
