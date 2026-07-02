"use server";

import { revalidatePath } from "next/cache";
import type {
  SupportTicketStatus,
  SupportTicketPriority,
} from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";

export type ActionResult = { ok: true } | { ok: false; error: string };

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

function isStatus(v: unknown): v is SupportTicketStatus {
  return typeof v === "string" && (STATUSES as string[]).includes(v);
}

function isPriority(v: unknown): v is SupportTicketPriority {
  return typeof v === "string" && (PRIORITIES as string[]).includes(v);
}

export async function replyToSupportTicket(
  ticketId: string,
  input: unknown
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!ticketId) return { ok: false, error: "معرف التذكرة مفقود" };

  const shape = input as Record<string, unknown>;
  const body =
    typeof shape.body === "string" ? shape.body.trim() : "";
  if (body.length < 1) return { ok: false, error: "الرد لا يمكن أن يكون فارغاً" };
  if (body.length > 5000) return { ok: false, error: "الرد طويل جداً" };

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  });
  if (!ticket) return { ok: false, error: "التذكرة غير موجودة" };

  await db.$transaction(async (tx) => {
    await tx.supportTicketMessage.create({
      data: {
        ticketId,
        authorRole: "ADMIN",
        authorId: admin.id,
        body,
      },
    });

    const nextStatus: SupportTicketStatus =
      ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status;

    await tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
        reply: body,
        replyAt: new Date(),
        assignedAdminId: admin.id,
      },
    });
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "SUPPORT_TICKET_REPLIED",
      entity: "SupportTicket",
      entityId: ticketId,
    },
  });

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
  return { ok: true };
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: unknown
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!ticketId) return { ok: false, error: "معرف التذكرة مفقود" };
  if (!isStatus(status)) return { ok: false, error: "حالة غير صالحة" };

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  });
  if (!ticket) return { ok: false, error: "التذكرة غير موجودة" };

  await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      assignedAdminId: admin.id,
    },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "SUPPORT_TICKET_STATUS_CHANGED",
      entity: "SupportTicket",
      entityId: ticketId,
      metadata: { from: ticket.status, to: status },
    },
  });

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
  return { ok: true };
}

export async function updateSupportTicketPriority(
  ticketId: string,
  priority: unknown
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!ticketId) return { ok: false, error: "معرف التذكرة مفقود" };
  if (!isPriority(priority))
    return { ok: false, error: "أولوية غير صالحة" };

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, priority: true },
  });
  if (!ticket) return { ok: false, error: "التذكرة غير موجودة" };

  await db.supportTicket.update({
    where: { id: ticketId },
    data: { priority },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "SUPPORT_TICKET_PRIORITY_CHANGED",
      entity: "SupportTicket",
      entityId: ticketId,
      metadata: { from: ticket.priority, to: priority },
    },
  });

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
  return { ok: true };
}
