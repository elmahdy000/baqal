"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import {
  createStoreSchema,
  createBuildingSchema,
  commissionRateSchema,
  settlementCreateSchema,
  settlementUpdateSchema,
} from "@/lib/validators";
import { generateBuildingCode, slugify } from "@/lib/utils";
import { DEFAULT_CATEGORIES_AR } from "@/lib/labels";
import { canAddBuilding } from "@/lib/plan-gating";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createStore(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = createStoreSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const data = parsed.data;

  const existing = await db.store.findUnique({ where: { slug: data.slug } });
  if (existing) return { ok: false, error: "الـ slug ده مستخدم قبل كده" };

  const emailTaken = await db.user.findUnique({ where: { email: data.ownerEmail } });
  if (emailTaken) return { ok: false, error: "الإيميل ده مستخدم قبل كده" };

  const passwordHash = await bcrypt.hash(data.ownerPassword, 12);

  await db.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: {
        name: data.name,
        nameAr: data.nameAr ?? data.name,
        slug: data.slug,
        phone: data.phone,
        status: "ACTIVE",
      },
    });

    await tx.user.create({
      data: {
        email: data.ownerEmail,
        passwordHash,
        name: data.ownerName,
        role: "STORE_OWNER",
        storeId: store.id,
      },
    });

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES_AR.map((nameAr, index) => ({
        name: nameAr,
        nameAr,
        slug: slugify(nameAr) || `cat-${index + 1}`,
        order: index,
        storeId: store.id,
      })),
    });

    const basicPlan = await tx.plan.findUnique({ where: { tier: "BASIC" } });
    if (basicPlan) {
      await tx.subscription.create({
        data: {
          storeId: store.id,
          planId: basicPlan.id,
          status: "TRIAL",
          billingCycle: "MONTHLY",
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          amount: 0,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        action: "STORE_CREATED",
        entity: "Store",
        entityId: store.id,
        metadata: { name: data.name, slug: data.slug, ownerEmail: data.ownerEmail },
      },
    });
  });

  revalidatePath("/admin/stores");
  revalidatePath("/admin");
  redirect("/admin/stores");
}

export async function toggleStoreStatus(storeId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!storeId) return { ok: false, error: "معرف بقالة مفقود" };

  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) return { ok: false, error: "البقالة غير موجودة" };

  const nextStatus = store.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  await db.store.update({ where: { id: storeId }, data: { status: nextStatus } });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "STORE_STATUS_CHANGED",
      entity: "Store",
      entityId: storeId,
      metadata: { from: store.status, to: nextStatus },
    },
  });

  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${storeId}`);
  return { ok: true };
}

export async function createBuilding(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = createBuildingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const data = parsed.data;

  const store = await db.store.findUnique({ where: { id: data.storeId } });
  if (!store) return { ok: false, error: "البقالة غير موجودة" };

  const gate = await canAddBuilding(data.storeId);
  if (!gate.allowed) {
    return { ok: false, error: gate.reason ?? "غير مسموح بإضافة عمارة جديدة" };
  }

  let code = "";
  let created: { id: string; code: string } | null = null;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateBuildingCode();
    try {
      const building = await db.building.create({
        data: {
          name: data.name,
          code,
          storeId: data.storeId,
          street: data.street,
          buildingNumber: data.buildingNumber,
          compoundName: data.compoundName,
          areaId: data.areaId,
        },
      });
      created = { id: building.id, code: building.code };
      break;
    } catch {
      // likely unique constraint on code — retry
    }
  }

  if (!created) return { ok: false, error: "تعذر توليد كود فريد للعمارة، جرب تاني" };

  const url = `${baseUrl}/b/${created.code}`;
  // ensure the URL is renderable as QR (throws if invalid — sanity check)
  await QRCode.toDataURL(url);

  await db.qRCode.create({
    data: {
      storeId: data.storeId,
      buildingId: created.id,
      code: created.code,
      url,
    },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "BUILDING_CREATED",
      entity: "Building",
      entityId: created.id,
      metadata: { code: created.code, storeId: data.storeId, name: data.name },
    },
  });

  revalidatePath("/admin/buildings");
  revalidatePath("/admin/qrcodes");
  revalidatePath(`/admin/stores/${data.storeId}`);
  return { ok: true };
}

export async function deleteBuilding(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!id) return { ok: false, error: "معرف عمارة مفقود" };

  const building = await db.building.findUnique({ where: { id } });
  if (!building) return { ok: false, error: "العمارة غير موجودة" };

  await db.building.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "BUILDING_DELETED",
      entity: "Building",
      entityId: id,
      metadata: { code: building.code, storeId: building.storeId },
    },
  });

  revalidatePath("/admin/buildings");
  revalidatePath("/admin/qrcodes");
  revalidatePath(`/admin/stores/${building.storeId}`);
  return { ok: true };
}

// ---------- Plans ----------

export type UpdatePlanInput = {
  name: string;
  nameAr: string;
  priceMonthly: number;
  priceYearly: number;
  maxBuildings: number;
  maxProducts: number;
  maxStoreUsers: number;
  features: string; // comma-separated
  isActive: boolean;
};

export async function updatePlan(id: string, input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!id) return { ok: false, error: "معرف الخطة مفقود" };

  const shape = input as Record<string, unknown>;
  const name = typeof shape.name === "string" ? shape.name.trim() : "";
  const nameAr = typeof shape.nameAr === "string" ? shape.nameAr.trim() : "";
  const priceMonthly = Number(shape.priceMonthly);
  const priceYearly = Number(shape.priceYearly);
  const maxBuildings = Number(shape.maxBuildings);
  const maxProducts = Number(shape.maxProducts);
  const maxStoreUsers = Number(shape.maxStoreUsers);
  const featuresRaw = typeof shape.features === "string" ? shape.features : "";
  const isActive = Boolean(shape.isActive);

  if (name.length < 1) return { ok: false, error: "اسم الخطة مطلوب" };
  if (nameAr.length < 1) return { ok: false, error: "الاسم بالعربي مطلوب" };
  if ([priceMonthly, priceYearly, maxBuildings, maxProducts, maxStoreUsers].some((n) => Number.isNaN(n) || n < 0)) {
    return { ok: false, error: "قيم غير صالحة" };
  }

  const features = featuresRaw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const plan = await db.plan.findUnique({ where: { id } });
  if (!plan) return { ok: false, error: "الخطة غير موجودة" };

  await db.plan.update({
    where: { id },
    data: {
      name,
      nameAr,
      priceMonthly,
      priceYearly,
      maxBuildings,
      maxProducts,
      maxStoreUsers,
      features,
      isActive,
    },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "PLAN_UPDATED",
      entity: "Plan",
      entityId: id,
      metadata: { tier: plan.tier },
    },
  });

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}/edit`);
  return { ok: true };
}

// ---------- Subscriptions ----------

export type UpdateSubscriptionInput = {
  planId: string;
  status: "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  billingCycle: "MONTHLY" | "YEARLY";
  amount?: number;
};

export async function updateSubscription(
  storeId: string,
  input: unknown
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!storeId) return { ok: false, error: "معرف البقالة مفقود" };

  const shape = input as Record<string, unknown>;
  const planId = typeof shape.planId === "string" ? shape.planId : "";
  const status = typeof shape.status === "string" ? shape.status : "";
  const billingCycle = typeof shape.billingCycle === "string" ? shape.billingCycle : "";
  const amount = shape.amount != null ? Number(shape.amount) : NaN;

  if (!planId) return { ok: false, error: "اختر خطة" };
  const validStatuses = ["ACTIVE", "TRIAL", "PAST_DUE", "CANCELLED", "EXPIRED"];
  if (!validStatuses.includes(status)) return { ok: false, error: "حالة غير صالحة" };
  const validCycles = ["MONTHLY", "YEARLY"];
  if (!validCycles.includes(billingCycle)) return { ok: false, error: "دورة فوترة غير صالحة" };

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan) return { ok: false, error: "الخطة غير موجودة" };

  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) return { ok: false, error: "البقالة غير موجودة" };

  const finalAmount =
    !Number.isNaN(amount) && amount >= 0
      ? amount
      : Number(billingCycle === "YEARLY" ? plan.priceYearly : plan.priceMonthly);

  const existing = await db.subscription.findUnique({ where: { storeId } });

  if (existing) {
    await db.subscription.update({
      where: { storeId },
      data: {
        planId,
        status: status as "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED" | "EXPIRED",
        billingCycle: billingCycle as "MONTHLY" | "YEARLY",
        amount: finalAmount,
      },
    });
  } else {
    await db.subscription.create({
      data: {
        storeId,
        planId,
        status: status as "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED" | "EXPIRED",
        billingCycle: billingCycle as "MONTHLY" | "YEARLY",
        startsAt: new Date(),
        endsAt: status === "TRIAL" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
        amount: finalAmount,
      },
    });
  }

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "SUBSCRIPTION_UPDATED",
      entity: "Subscription",
      entityId: storeId,
      metadata: { planId, status, billingCycle },
    },
  });

  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/stores/${storeId}`);
  return { ok: true };
}

// ---------- Areas ----------

export async function createArea(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const shape = input as Record<string, unknown>;
  const name = typeof shape.name === "string" ? shape.name.trim() : "";
  const nameAr = typeof shape.nameAr === "string" ? shape.nameAr.trim() : "";
  const city = typeof shape.city === "string" ? shape.city.trim() : "";

  if (name.length < 1) return { ok: false, error: "الاسم مطلوب" };

  const area = await db.area.create({
    data: {
      name,
      nameAr: nameAr || null,
      city: city || null,
    },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "AREA_CREATED",
      entity: "Area",
      entityId: area.id,
      metadata: { name },
    },
  });

  revalidatePath("/admin/areas");
  return { ok: true };
}

export async function updateArea(id: string, input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!id) return { ok: false, error: "معرف المنطقة مفقود" };

  const shape = input as Record<string, unknown>;
  const name = typeof shape.name === "string" ? shape.name.trim() : "";
  const nameAr = typeof shape.nameAr === "string" ? shape.nameAr.trim() : "";
  const city = typeof shape.city === "string" ? shape.city.trim() : "";

  if (name.length < 1) return { ok: false, error: "الاسم مطلوب" };

  const area = await db.area.findUnique({ where: { id } });
  if (!area) return { ok: false, error: "المنطقة غير موجودة" };

  await db.area.update({
    where: { id },
    data: {
      name,
      nameAr: nameAr || null,
      city: city || null,
    },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "AREA_UPDATED",
      entity: "Area",
      entityId: id,
    },
  });

  revalidatePath("/admin/areas");
  return { ok: true };
}

export async function deleteArea(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!id) return { ok: false, error: "معرف المنطقة مفقود" };

  const area = await db.area.findUnique({
    where: { id },
    include: { _count: { select: { buildings: true } } },
  });
  if (!area) return { ok: false, error: "المنطقة غير موجودة" };
  if (area._count.buildings > 0) {
    return { ok: false, error: "لا يمكن حذف منطقة بها عمارات" };
  }

  await db.area.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "AREA_DELETED",
      entity: "Area",
      entityId: id,
      metadata: { name: area.name },
    },
  });

  revalidatePath("/admin/areas");
  return { ok: true };
}

// ---------- Platform commission + settlements ----------

export async function updateStoreCommissionRate(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = commissionRateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  const { storeId, rate } = parsed.data;
  const store = await db.store.findUnique({ where: { id: storeId }, select: { id: true, name: true } });
  if (!store) return { ok: false, error: "البقالة غير موجودة" };

  await db.store.update({
    where: { id: storeId },
    data: { platformCommissionRate: rate },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "STORE_COMMISSION_UPDATED",
      entity: "Store",
      entityId: storeId,
      metadata: { rate, storeName: store.name },
    },
  });

  revalidatePath(`/admin/stores/${storeId}`);
  revalidatePath("/admin/reports");
  return { ok: true };
}

export async function createSettlement(
  input: unknown
): Promise<ActionResult & { id?: string; amount?: number; count?: number }> {
  const admin = await requireAdmin();
  const parsed = settlementCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  const { storeId, method, reference, notes } = parsed.data;
  const store = await db.store.findUnique({ where: { id: storeId }, select: { id: true, name: true } });
  if (!store) return { ok: false, error: "البقالة غير موجودة" };

  const orders = await db.order.findMany({
    where: {
      storeId,
      status: "DELIVERED",
      platformCommission: { not: null },
      settlementId: null,
    },
    select: { id: true, platformCommission: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (orders.length === 0) return { ok: false, error: "مفيش أوردرات غير مسواة" };

  const amount = orders.reduce((sum, o) => sum + Number(o.platformCommission ?? 0), 0);
  const fromDate = orders[0].createdAt;
  const toDate = orders[orders.length - 1].createdAt;

  const settlement = await db.$transaction(async (tx) => {
    const s = await tx.settlement.create({
      data: {
        storeId,
        amount,
        orderCount: orders.length,
        fromDate,
        toDate,
        status: "PENDING",
        method: method ?? null,
        reference: reference ?? null,
        notes: notes ?? null,
      },
    });
    await tx.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) } },
      data: { settlementId: s.id },
    });
    return s;
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "SETTLEMENT_CREATED",
      entity: "Settlement",
      entityId: settlement.id,
      metadata: { storeId, amount, orderCount: orders.length },
    },
  });

  revalidatePath("/admin/settlements");
  revalidatePath(`/admin/stores/${storeId}`);
  return { ok: true, id: settlement.id, amount, count: orders.length };
}

export async function markSettlementPaid(id: string, input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!id) return { ok: false, error: "معرف التسوية مفقود" };

  const parsed = settlementUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  const { status, method, reference, notes } = parsed.data;
  const settlement = await db.settlement.findUnique({ where: { id } });
  if (!settlement) return { ok: false, error: "التسوية غير موجودة" };

  const paidAt = status === "PAID" ? new Date() : null;

  await db.$transaction(async (tx) => {
    await tx.settlement.update({
      where: { id },
      data: {
        status,
        method: method ?? settlement.method,
        reference: reference ?? settlement.reference,
        notes: notes ?? settlement.notes,
        paidAt,
      },
    });

    if (status === "PAID" && paidAt) {
      await tx.order.updateMany({
        where: { settlementId: id },
        data: { platformCommissionSettledAt: paidAt },
      });
    }

    if (status === "CANCELLED") {
      await tx.order.updateMany({
        where: { settlementId: id },
        data: { settlementId: null, platformCommissionSettledAt: null },
      });
    }
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: `SETTLEMENT_${status}`,
      entity: "Settlement",
      entityId: id,
      metadata: { storeId: settlement.storeId, amount: Number(settlement.amount) },
    },
  });

  revalidatePath("/admin/settlements");
  revalidatePath(`/admin/settlements/${id}`);
  revalidatePath(`/admin/stores/${settlement.storeId}`);
  return { ok: true };
}
