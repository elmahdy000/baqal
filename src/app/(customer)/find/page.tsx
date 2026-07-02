import { db } from "@/lib/db";
import { StoreSelector } from "@/components/customer/store-selector";
import { BottomNav } from "@/components/customer/bottom-nav";

export const dynamic = "force-dynamic";

export default async function FindStorePage() {
  const areas = await db.area.findMany({
    include: {
      buildings: {
        include: {
          store: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Map and group stores uniquely per area
  const areasWithStores = areas
    .map((area) => {
      const storeMap = new Map<string, any>();
      area.buildings.forEach((b) => {
        if (b.store && b.store.status === "ACTIVE") {
          storeMap.set(b.store.id, b.store);
        }
      });

      return {
        id: area.id,
        name: area.name,
        nameAr: area.nameAr || area.name,
        stores: Array.from(storeMap.values()).map((store) => ({
          id: store.id,
          name: store.name,
          nameAr: store.nameAr,
          slug: store.slug,
          deliveryFee: Number(store.deliveryFee),
          minOrderAmount: Number(store.minOrderAmount),
          isOpen: store.isOpen,
        })),
      };
    })
    .filter((a) => a.stores.length > 0); // Only display areas that have active stores

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      <StoreSelector areas={areasWithStores} />
      <BottomNav />
    </div>
  );
}
