import { db } from "@/lib/db";
import type { Plan, Subscription } from "@prisma/client";

export type PlanLimits = { buildings: number; products: number; users: number };

export type StorePlanInfo = {
  plan: Plan | null;
  subscription: Subscription | null;
  limits: PlanLimits;
};

const ZERO_LIMITS: PlanLimits = { buildings: 0, products: 0, users: 0 };

export async function getStorePlan(storeId: string): Promise<StorePlanInfo> {
  const subscription = await db.subscription.findUnique({
    where: { storeId },
    include: { plan: true },
  });

  if (!subscription) {
    return { plan: null, subscription: null, limits: ZERO_LIMITS };
  }

  const plan = subscription.plan;
  const { plan: _p, ...rest } = subscription;
  void _p;

  return {
    plan,
    subscription: rest as Subscription,
    limits: {
      buildings: plan.maxBuildings,
      products: plan.maxProducts,
      users: plan.maxStoreUsers,
    },
  };
}

export type GateResult = {
  allowed: boolean;
  used: number;
  limit: number;
  reason?: string;
};

function inactiveReason(status: string | undefined): string {
  if (!status) return "لا يوجد اشتراك مفعّل — تواصل مع المدير";
  if (status === "PAST_DUE" || status === "EXPIRED" || status === "CANCELLED") {
    return "اشتراكك انتهى — تواصل مع المدير";
  }
  return "لا يوجد اشتراك مفعّل — تواصل مع المدير";
}

function isActiveSubscription(sub: Subscription | null): boolean {
  if (!sub) return false;
  return sub.status === "ACTIVE" || sub.status === "TRIAL";
}

export async function canAddBuilding(storeId: string): Promise<GateResult> {
  const { plan, subscription, limits } = await getStorePlan(storeId);
  const used = await db.building.count({ where: { storeId } });

  if (!plan || !isActiveSubscription(subscription)) {
    return {
      allowed: false,
      used,
      limit: limits.buildings,
      reason: inactiveReason(subscription?.status),
    };
  }
  if (used >= limits.buildings) {
    return {
      allowed: false,
      used,
      limit: limits.buildings,
      reason: "وصلت للحد الأقصى للعمارات في خطتك — قم بالترقية",
    };
  }
  return { allowed: true, used, limit: limits.buildings };
}

export async function canAddProduct(storeId: string): Promise<GateResult> {
  const { plan, subscription, limits } = await getStorePlan(storeId);
  const used = await db.product.count({ where: { storeId } });

  if (!plan || !isActiveSubscription(subscription)) {
    return {
      allowed: false,
      used,
      limit: limits.products,
      reason: inactiveReason(subscription?.status),
    };
  }
  if (used >= limits.products) {
    return {
      allowed: false,
      used,
      limit: limits.products,
      reason: "وصلت للحد الأقصى للمنتجات في خطتك — قم بالترقية",
    };
  }
  return { allowed: true, used, limit: limits.products };
}

export async function canAddStoreUser(storeId: string): Promise<GateResult> {
  const { plan, subscription, limits } = await getStorePlan(storeId);
  const used = await db.user.count({
    where: { storeId, isActive: true },
  });

  if (!plan || !isActiveSubscription(subscription)) {
    return {
      allowed: false,
      used,
      limit: limits.users,
      reason: inactiveReason(subscription?.status),
    };
  }
  if (used >= limits.users) {
    return {
      allowed: false,
      used,
      limit: limits.users,
      reason: "وصلت للحد الأقصى للمستخدمين في خطتك — قم بالترقية",
    };
  }
  return { allowed: true, used, limit: limits.users };
}

export async function hasFeature(storeId: string, feature: string): Promise<boolean> {
  const { plan, subscription } = await getStorePlan(storeId);
  if (!plan || !isActiveSubscription(subscription)) return false;
  const raw = plan.features;
  if (!raw) return false;
  try {
    if (Array.isArray(raw)) {
      return raw.some((f) => typeof f === "string" && f === feature);
    }
    if (typeof raw === "string") {
      return raw
        .split(",")
        .map((f) => f.trim())
        .includes(feature);
    }
    if (typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      return Boolean(obj[feature]);
    }
  } catch {
    return false;
  }
  return false;
}
