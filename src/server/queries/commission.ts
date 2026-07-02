import { db } from "@/lib/db";

export type StoreCommissionSummary = {
  totalEarnedAllTime: number;
  totalOwed: number;
  totalPaid: number;
  ordersUnsettled: number;
  ordersSettled: number;
  currentRate: number;
};

export async function getStoreCommissionSummary(storeId: string): Promise<StoreCommissionSummary> {
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { platformCommissionRate: true },
  });

  const [earned, owed, paid, unsettledCount, settledCount] = await Promise.all([
    db.order.aggregate({
      where: { storeId, status: "DELIVERED", platformCommission: { not: null } },
      _sum: { platformCommission: true },
    }),
    db.order.aggregate({
      where: {
        storeId,
        status: "DELIVERED",
        platformCommission: { not: null },
        platformCommissionSettledAt: null,
      },
      _sum: { platformCommission: true },
    }),
    db.order.aggregate({
      where: {
        storeId,
        status: "DELIVERED",
        platformCommission: { not: null },
        platformCommissionSettledAt: { not: null },
      },
      _sum: { platformCommission: true },
    }),
    db.order.count({
      where: {
        storeId,
        status: "DELIVERED",
        platformCommission: { not: null },
        settlementId: null,
      },
    }),
    db.order.count({
      where: {
        storeId,
        status: "DELIVERED",
        platformCommission: { not: null },
        platformCommissionSettledAt: { not: null },
      },
    }),
  ]);

  return {
    totalEarnedAllTime: Number(earned._sum.platformCommission ?? 0),
    totalOwed: Number(owed._sum.platformCommission ?? 0),
    totalPaid: Number(paid._sum.platformCommission ?? 0),
    ordersUnsettled: unsettledCount,
    ordersSettled: settledCount,
    currentRate: Number(store?.platformCommissionRate ?? 0),
  };
}

export type PlatformCommissionSummary = {
  totalEarnedAllTime: number;
  totalOwedByStores: number;
  totalCollected: number;
  totalPending: number;
  activeStores: number;
  perStore: Array<{
    storeId: string;
    storeName: string;
    slug: string;
    rate: number;
    earned: number;
    owed: number;
    paid: number;
  }>;
};

export async function getPlatformCommissionSummary(): Promise<PlatformCommissionSummary> {
  const [earned, owed, paid, pendingSettlements, activeStores, stores] = await Promise.all([
    db.order.aggregate({
      where: { status: "DELIVERED", platformCommission: { not: null } },
      _sum: { platformCommission: true },
    }),
    db.order.aggregate({
      where: {
        status: "DELIVERED",
        platformCommission: { not: null },
        platformCommissionSettledAt: null,
      },
      _sum: { platformCommission: true },
    }),
    db.settlement.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    db.settlement.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
    }),
    db.store.count({ where: { status: "ACTIVE" } }),
    db.store.findMany({
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        platformCommissionRate: true,
      },
    }),
  ]);

  const perStore = await Promise.all(
    stores.map(async (s) => {
      const [e, o, p] = await Promise.all([
        db.order.aggregate({
          where: { storeId: s.id, status: "DELIVERED", platformCommission: { not: null } },
          _sum: { platformCommission: true },
        }),
        db.order.aggregate({
          where: {
            storeId: s.id,
            status: "DELIVERED",
            platformCommission: { not: null },
            platformCommissionSettledAt: null,
          },
          _sum: { platformCommission: true },
        }),
        db.order.aggregate({
          where: {
            storeId: s.id,
            status: "DELIVERED",
            platformCommission: { not: null },
            platformCommissionSettledAt: { not: null },
          },
          _sum: { platformCommission: true },
        }),
      ]);
      return {
        storeId: s.id,
        storeName: s.nameAr ?? s.name,
        slug: s.slug,
        rate: Number(s.platformCommissionRate),
        earned: Number(e._sum.platformCommission ?? 0),
        owed: Number(o._sum.platformCommission ?? 0),
        paid: Number(p._sum.platformCommission ?? 0),
      };
    })
  );

  perStore.sort((a, b) => b.owed - a.owed);

  return {
    totalEarnedAllTime: Number(earned._sum.platformCommission ?? 0),
    totalOwedByStores: Number(owed._sum.platformCommission ?? 0),
    totalCollected: Number(paid._sum.amount ?? 0),
    totalPending: Number(pendingSettlements._sum.amount ?? 0),
    activeStores,
    perStore,
  };
}
