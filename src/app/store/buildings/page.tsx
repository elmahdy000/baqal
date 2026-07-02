import { db } from "@/lib/db";
import { requireStore } from "@/lib/rbac";
import { BuildingsClient, type BuildingRow } from "./_client";

export const dynamic = "force-dynamic";

const COUNTED_STATUSES = [
  "ACCEPTED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export default async function BuildingsPage() {
  const user = await requireStore();

  const buildings = await db.building.findMany({
    where: { storeId: user.storeId },
    include: {
      area: true,
      qrCodes: { orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const ids = buildings.map((b) => b.id);

  const [orderAgg, customerCounts] = ids.length
    ? await Promise.all([
        db.order.groupBy({
          by: ["buildingId"],
          where: {
            storeId: user.storeId,
            buildingId: { in: ids },
            status: { in: [...COUNTED_STATUSES] },
          },
          _count: { _all: true },
          _sum: { total: true },
          _max: { createdAt: true },
        }),
        // Unique customers per building via distinct addresses
        db.address.groupBy({
          by: ["buildingId"],
          where: { buildingId: { in: ids }, customer: { storeId: user.storeId } },
          _count: { customerId: true },
        }),
      ])
    : [[], []];

  const ordersByBuilding = new Map<
    string,
    { orders: number; revenue: number; lastAt: Date | null }
  >();
  orderAgg.forEach((r) => {
    if (!r.buildingId) return;
    ordersByBuilding.set(r.buildingId, {
      orders: r._count?._all ?? 0,
      revenue: Number(r._sum?.total ?? 0),
      lastAt: r._max?.createdAt ?? null,
    });
  });

  const customersByBuilding = new Map<string, number>();
  customerCounts.forEach((r) => {
    if (r.buildingId) customersByBuilding.set(r.buildingId, r._count?.customerId ?? 0);
  });

  const rows: BuildingRow[] = buildings.map((b) => {
    const stats = ordersByBuilding.get(b.id) ?? {
      orders: 0,
      revenue: 0,
      lastAt: null,
    };
    const qrHead = b.qrCodes[0] ?? null;
    const totalScans = b.qrCodes.reduce((s, q) => s + (q.scanCount ?? 0), 0);
    const lastScannedAt = b.qrCodes.reduce<Date | null>((acc, q) => {
      if (!q.lastScannedAt) return acc;
      if (!acc || q.lastScannedAt > acc) return q.lastScannedAt;
      return acc;
    }, null);
    return {
      id: b.id,
      name: b.name,
      code: b.code,
      areaName: b.area?.nameAr ?? b.area?.name ?? null,
      street: b.street,
      buildingNumber: b.buildingNumber,
      compoundName: b.compoundName,
      isActive: b.isActive,
      deliveryFee: b.deliveryFee != null ? Number(b.deliveryFee) : null,
      qrCount: b.qrCodes.length,
      qrCode: qrHead?.code ?? null,
      qrUrl: qrHead?.url ?? null,
      totalScans,
      lastScannedAt: lastScannedAt?.toISOString() ?? null,
      orders: stats.orders,
      revenue: stats.revenue,
      lastOrderAt: stats.lastAt?.toISOString() ?? null,
      customers: customersByBuilding.get(b.id) ?? 0,
    };
  });

  return <BuildingsClient buildings={rows} />;
}
