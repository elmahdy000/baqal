import { db } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

function startOfDayFor(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const REVENUE_STATUSES = ["ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
const CANCELLED_STATUSES = ["CANCELLED", "REJECTED"] as const;

export type StoreReport = Awaited<ReturnType<typeof getStoreReport>>;
export type PlatformReport = Awaited<ReturnType<typeof getPlatformReport>>;

export async function getStoreReport(storeId: string) {
  const today = startOfToday();
  const week = daysAgo(7);
  const month = daysAgo(30);
  const fourteenDays = startOfDayFor(daysAgo(13));

  const [
    todayRevAgg,
    weekRevAgg,
    monthRevAgg,
    todayOrders,
    weekOrders,
    monthOrders,
    cancelledMonth,
    avgAgg,
    topItems,
    lowStockRows,
    topCustomersRaw,
    topBuildingsRaw,
    dailyRows,
    totalOrdersEver,
  ] = await Promise.all([
    db.order.aggregate({
      _sum: { total: true },
      where: {
        storeId,
        createdAt: { gte: today },
        status: { in: [...REVENUE_STATUSES] },
      },
    }),
    db.order.aggregate({
      _sum: { total: true },
      where: {
        storeId,
        createdAt: { gte: week },
        status: { in: [...REVENUE_STATUSES] },
      },
    }),
    db.order.aggregate({
      _sum: { total: true },
      where: {
        storeId,
        createdAt: { gte: month },
        status: { in: [...REVENUE_STATUSES] },
      },
    }),
    db.order.count({ where: { storeId, createdAt: { gte: today } } }),
    db.order.count({ where: { storeId, createdAt: { gte: week } } }),
    db.order.count({ where: { storeId, createdAt: { gte: month } } }),
    db.order.count({
      where: {
        storeId,
        createdAt: { gte: month },
        status: { in: [...CANCELLED_STATUSES] },
      },
    }),
    db.order.aggregate({
      _avg: { total: true },
      where: {
        storeId,
        createdAt: { gte: month },
        status: { in: [...REVENUE_STATUSES] },
      },
    }),
    db.orderItem.groupBy({
      by: ["productId", "productNameSnapshot"],
      where: {
        order: {
          storeId,
          createdAt: { gte: month },
          status: { in: [...REVENUE_STATUSES] },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Product"
      WHERE "storeId" = ${storeId}
        AND "stockQuantity" > 0
        AND "stockQuantity" <= "lowStockThreshold"
    `,
    db.order.groupBy({
      by: ["customerId"],
      where: { storeId, createdAt: { gte: month } },
      _count: { _all: true },
      orderBy: { _count: { customerId: "desc" } },
      take: 5,
    }),
    db.order.groupBy({
      by: ["buildingId"],
      where: { storeId, createdAt: { gte: month }, buildingId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { buildingId: "desc" } },
      take: 10,
    }),
    db.$queryRaw<{ day: Date; revenue: string | null; order_count: bigint }[]>`
      SELECT
        date_trunc('day', "createdAt") AS day,
        SUM(CASE WHEN "status" IN ('ACCEPTED','PREPARING','OUT_FOR_DELIVERY','DELIVERED') THEN "total" ELSE 0 END)::text AS revenue,
        COUNT(*)::bigint AS order_count
      FROM "Order"
      WHERE "storeId" = ${storeId}
        AND "createdAt" >= ${fourteenDays}
      GROUP BY day
      ORDER BY day ASC
    `,
    db.order.count({ where: { storeId } }),
  ]);

  const productIds = topItems.map((t) => t.productId);
  const customerIds = topCustomersRaw.map((c) => c.customerId);
  const buildingIds = topBuildingsRaw
    .map((b) => b.buildingId)
    .filter((id): id is string => Boolean(id));

  const [products, customers, buildings] = await Promise.all([
    productIds.length
      ? db.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, nameAr: true },
        })
      : Promise.resolve([]),
    customerIds.length
      ? db.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true, phone: true },
        })
      : Promise.resolve([]),
    buildingIds.length
      ? db.building.findMany({
          where: { id: { in: buildingIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const buildingMap = new Map(buildings.map((b) => [b.id, b]));

  const topProducts = topItems.map((t) => {
    const p = productMap.get(t.productId);
    return {
      productId: t.productId,
      name: p?.nameAr || p?.name || t.productNameSnapshot,
      quantity: Number(t._sum.quantity ?? 0),
    };
  });

  const topCustomers = topCustomersRaw.map((c) => {
    const cust = customerMap.get(c.customerId);
    return {
      customerId: c.customerId,
      name: cust?.name ?? "—",
      phone: cust?.phone ?? "",
      orderCount: c._count._all,
    };
  });

  const topBuildings = topBuildingsRaw
    .filter((b) => b.buildingId)
    .map((b) => {
      const bld = buildingMap.get(b.buildingId as string);
      return {
        buildingId: b.buildingId as string,
        name: bld?.name ?? "—",
        orderCount: b._count._all,
      };
    });

  const dailyMap = new Map<string, { revenue: number; orderCount: number }>();
  for (const row of dailyRows) {
    const key = new Date(row.day).toISOString().slice(0, 10);
    dailyMap.set(key, {
      revenue: Number(row.revenue ?? 0),
      orderCount: Number(row.order_count),
    });
  }
  const salesByDay: { date: string; revenue: number; orderCount: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = startOfDayFor(daysAgo(i));
    const key = d.toISOString().slice(0, 10);
    const row = dailyMap.get(key);
    salesByDay.push({
      date: key,
      revenue: row?.revenue ?? 0,
      orderCount: row?.orderCount ?? 0,
    });
  }

  return {
    revenue: {
      today: Number(todayRevAgg._sum.total ?? 0),
      week: Number(weekRevAgg._sum.total ?? 0),
      month: Number(monthRevAgg._sum.total ?? 0),
    },
    orders: {
      today: todayOrders,
      week: weekOrders,
      month: monthOrders,
      totalEver: totalOrdersEver,
    },
    cancelledMonth,
    avgOrderValue: Number(avgAgg._avg.total ?? 0),
    topProducts,
    lowStockCount: Number(lowStockRows[0]?.count ?? 0),
    topCustomers,
    topBuildings,
    salesByDay,
  };
}

export async function getPlatformReport() {
  const month = daysAgo(30);
  const fourteenDays = startOfDayFor(daysAgo(13));

  const [
    totalOrdersAllTime,
    totalOrdersMonth,
    revenueAgg,
    revenuePerStoreRaw,
    ordersByAreaRaw,
    subActive,
    subTrial,
    subPastDue,
    subCancelled,
    topBuildingsRaw,
    qrScansAgg,
    activeStores,
    suspendedStores,
    activeMonthlySubs,
    activeYearlySubs,
    dailyRows,
  ] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { createdAt: { gte: month } } }),
    db.order.aggregate({
      _sum: { total: true },
      where: { status: { in: [...REVENUE_STATUSES] } },
    }),
    db.order.groupBy({
      by: ["storeId"],
      where: { status: { in: [...REVENUE_STATUSES] } },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
    db.$queryRaw<{ areaId: string | null; nameAr: string | null; name: string | null; order_count: bigint }[]>`
      SELECT a."id" AS "areaId", a."nameAr", a."name", COUNT(o.*)::bigint AS order_count
      FROM "Order" o
      JOIN "Building" b ON b."id" = o."buildingId"
      LEFT JOIN "Area" a ON a."id" = b."areaId"
      WHERE o."createdAt" >= ${month}
      GROUP BY a."id", a."nameAr", a."name"
      ORDER BY order_count DESC
      LIMIT 10
    `,
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "TRIAL" } }),
    db.subscription.count({ where: { status: "PAST_DUE" } }),
    db.subscription.count({ where: { status: "CANCELLED" } }),
    db.qRCode.findMany({
      orderBy: { scanCount: "desc" },
      take: 10,
      select: {
        id: true,
        scanCount: true,
        building: { select: { name: true } },
      },
    }),
    db.qRCode.aggregate({ _sum: { scanCount: true } }),
    db.store.count({ where: { status: "ACTIVE" } }),
    db.store.count({ where: { status: "SUSPENDED" } }),
    db.subscription.findMany({
      where: { status: "ACTIVE", billingCycle: "MONTHLY" },
      select: { amount: true },
    }),
    db.subscription.findMany({
      where: { status: "ACTIVE", billingCycle: "YEARLY" },
      select: { amount: true },
    }),
    db.$queryRaw<{ day: Date; revenue: string | null; order_count: bigint }[]>`
      SELECT
        date_trunc('day', "createdAt") AS day,
        SUM(CASE WHEN "status" IN ('ACCEPTED','PREPARING','OUT_FOR_DELIVERY','DELIVERED') THEN "total" ELSE 0 END)::text AS revenue,
        COUNT(*)::bigint AS order_count
      FROM "Order"
      WHERE "createdAt" >= ${fourteenDays}
      GROUP BY day
      ORDER BY day ASC
    `,
  ]);

  const storeIds = revenuePerStoreRaw.map((r) => r.storeId);
  const stores = storeIds.length
    ? await db.store.findMany({
        where: { id: { in: storeIds } },
        select: { id: true, name: true, nameAr: true },
      })
    : [];
  const storeMap = new Map(stores.map((s) => [s.id, s]));

  const revenuePerStore = revenuePerStoreRaw.map((r) => {
    const s = storeMap.get(r.storeId);
    return {
      storeId: r.storeId,
      name: s?.nameAr || s?.name || "—",
      revenue: Number(r._sum.total ?? 0),
    };
  });

  const ordersByArea = ordersByAreaRaw.map((r) => ({
    areaId: r.areaId,
    name: r.nameAr || r.name || "بدون منطقة",
    orderCount: Number(r.order_count),
  }));

  const topBuildings = topBuildingsRaw.map((b) => ({
    id: b.id,
    name: b.building?.name ?? "—",
    scanCount: b.scanCount,
  }));

  const mrrMonthly = activeMonthlySubs.reduce((acc, s) => acc + Number(s.amount), 0);
  const mrrYearly = activeYearlySubs.reduce((acc, s) => acc + Number(s.amount) / 12, 0);
  const mrr = mrrMonthly + mrrYearly;

  const dailyMap = new Map<string, { revenue: number; orderCount: number }>();
  for (const row of dailyRows) {
    const key = new Date(row.day).toISOString().slice(0, 10);
    dailyMap.set(key, {
      revenue: Number(row.revenue ?? 0),
      orderCount: Number(row.order_count),
    });
  }
  const dailyOrders: { date: string; revenue: number; orderCount: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = startOfDayFor(daysAgo(i));
    const key = d.toISOString().slice(0, 10);
    const row = dailyMap.get(key);
    dailyOrders.push({
      date: key,
      revenue: row?.revenue ?? 0,
      orderCount: row?.orderCount ?? 0,
    });
  }

  return {
    orders: {
      allTime: totalOrdersAllTime,
      month: totalOrdersMonth,
    },
    totalRevenue: Number(revenueAgg._sum.total ?? 0),
    revenuePerStore,
    ordersByArea,
    subscriptions: {
      active: subActive,
      trial: subTrial,
      pastDue: subPastDue,
      cancelled: subCancelled,
    },
    topBuildings,
    totalScans: Number(qrScansAgg._sum.scanCount ?? 0),
    stores: {
      active: activeStores,
      suspended: suspendedStores,
    },
    mrr,
    dailyOrders,
  };
}
