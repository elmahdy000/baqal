import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function auditLog(input: {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: unknown;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    // Never let audit failures bubble up.
    console.error("[audit] failed to write log", err);
  }
}
