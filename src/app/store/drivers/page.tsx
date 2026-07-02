import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { DriversClient } from "./_client";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY"] as const;

export default async function StoreDriversPage() {
  const user = await requireStore();

  const drivers = await db.user.findMany({
    where: { storeId: user.storeId, role: "DELIVERY" },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const driverIds = drivers.map((d) => d.id);

  // Today window in the store's local sense (server-local midnight).
  // Good enough for the "today" KPI without pulling a timezone dep.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [activeCounts, deliveredTodayCounts, deliveredTotalCounts, lastDelivered] =
    driverIds.length
      ? await Promise.all([
          db.order.groupBy({
            by: ["driverId"],
            where: {
              storeId: user.storeId,
              driverId: { in: driverIds },
              status: { in: [...ACTIVE_STATUSES] },
            },
            _count: { _all: true },
          }),
          db.order.groupBy({
            by: ["driverId"],
            where: {
              storeId: user.storeId,
              driverId: { in: driverIds },
              status: "DELIVERED",
              updatedAt: { gte: startOfToday },
            },
            _count: { _all: true },
          }),
          db.order.groupBy({
            by: ["driverId"],
            where: {
              storeId: user.storeId,
              driverId: { in: driverIds },
              status: "DELIVERED",
            },
            _count: { _all: true },
          }),
          db.order.groupBy({
            by: ["driverId"],
            where: {
              storeId: user.storeId,
              driverId: { in: driverIds },
              status: "DELIVERED",
            },
            _max: { updatedAt: true },
          }),
        ])
      : [[], [], [], []];

  const activeMap = new Map<string, number>();
  activeCounts.forEach((r) => {
    if (r.driverId) activeMap.set(r.driverId, r._count?._all ?? 0);
  });
  const todayMap = new Map<string, number>();
  deliveredTodayCounts.forEach((r) => {
    if (r.driverId) todayMap.set(r.driverId, r._count?._all ?? 0);
  });
  const totalMap = new Map<string, number>();
  deliveredTotalCounts.forEach((r) => {
    if (r.driverId) totalMap.set(r.driverId, r._count?._all ?? 0);
  });
  const lastMap = new Map<string, Date | null>();
  lastDelivered.forEach((r) => {
    if (r.driverId) lastMap.set(r.driverId, r._max?.updatedAt ?? null);
  });

  const enriched = drivers.map((d) => ({
    id: d.id,
    name: d.name ?? "",
    email: d.email,
    phone: d.phone ?? "",
    isActive: d.isActive,
    createdAt: d.createdAt.toISOString(),
    activeCount: activeMap.get(d.id) ?? 0,
    deliveredToday: todayMap.get(d.id) ?? 0,
    deliveredTotal: totalMap.get(d.id) ?? 0,
    lastDeliveredAt: lastMap.get(d.id)?.toISOString() ?? null,
  }));

  return <DriversClient drivers={enriched} />;
}
