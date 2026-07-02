import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatEGP, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/customer/search-bar";
import { CategoryScroller } from "@/components/customer/category-scroller";
import { ProductCard, type ProductCardData } from "@/components/customer/product-card";
import { FloatingCart } from "@/components/customer/floating-cart";
import { BottomNav } from "@/components/customer/bottom-nav";
import { PwaRegister } from "@/components/customer/pwa-register";
import { FavoritesLink } from "@/components/customer/favorites-link";
import { AddAllButton } from "@/components/customer/add-all-button";
import { Store as StoreIcon, MessageSquare, Percent, Zap, Flame, Star, ShoppingBasket, TrendingUp } from "lucide-react";
import { isStoreOpenNow } from "@/lib/hours";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ bcode?: string; cat?: string; q?: string; offer?: string }>;
}) {
  const { slug } = await params;
  const { bcode, cat, q, offer } = await searchParams;

  const store = await db.store.findUnique({ where: { slug } });
  if (!store || store.status !== "ACTIVE") notFound();

  const now = new Date();

  const [categories, buildingInfo, activeOffers, currentOffer] = await Promise.all([
    db.category.findMany({
      where: { storeId: store.id },
      orderBy: { order: "asc" },
    }),
    bcode
      ? db.qRCode.findUnique({
          where: { code: bcode },
          include: { building: true },
        })
      : Promise.resolve(null),
    db.offer.findMany({
      where: {
        storeId: store.id,
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    }),
    offer
      ? db.offer.findFirst({ where: { id: offer, storeId: store.id } })
      : Promise.resolve(null),
  ]);

  const buildingName =
    buildingInfo?.building?.storeId === store.id ? buildingInfo.building.name : null;

  const activeCategory = cat ? categories.find((c) => c.slug === cat) : null;

  const productsWhere: {
    storeId: string;
    isAvailable: boolean;
    categoryId?: string;
    id?: { in: string[] };
    OR?: Array<{ name?: { contains: string; mode: "insensitive" }; nameAr?: { contains: string; mode: "insensitive" } }>;
  } = {
    storeId: store.id,
    isAvailable: true,
  };
  if (activeCategory) productsWhere.categoryId = activeCategory.id;
  if (currentOffer) {
    productsWhere.id = { in: currentOffer.productIds };
  }
  if (q && q.trim()) {
    productsWhere.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { nameAr: { contains: q, mode: "insensitive" } },
    ];
  }

  const products = await db.product.findMany({
    where: productsWhere,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const productCards: ProductCardData[] = products.map((p) => ({
    id: p.id,
    nameAr: p.nameAr ?? p.name,
    price: Number(p.price),
    discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
    imageUrl: p.imageUrl,
    stockQuantity: p.stockQuantity,
    isAvailable: p.isAvailable,
    unit: p.unit,
  }));

  // Quick-order / emergency section
  const emergencyCategory = categories.find(
    (c) => c.slug === "emergency" || c.nameAr === "محتاجه بسرعة"
  );
  const emergencyProducts = emergencyCategory
    ? productCards.filter((_, idx) => products[idx].categoryId === emergencyCategory.id)
    : [];

  const displayName = store.nameAr ?? store.name;

  return (
    <div className="min-h-screen pb-24 bg-slate-50" dir="rtl">
      <PwaRegister />

      {/* Modern Store Header Card Area */}
      <div className="bg-white border-b border-slate-100/80 p-4 space-y-4">
        {/* Store Header Card */}
        <div className="bg-gradient-to-br from-green-50/30 via-white to-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-[#ECFDF5] flex items-center justify-center shrink-0 shadow-sm border border-green-100">
              <StoreIcon className="h-6 w-6 text-[#16A34A]" />
            </div>
            <div className="min-w-0 space-y-1">
              <h1 className="font-black text-base text-slate-900 truncate leading-tight">{displayName}</h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-extrabold">
                <span>التوصيل: {formatEGP(Number(store.deliveryFee))}</span>
                <span className="text-slate-300">•</span>
                <span>أقل طلب: {formatEGP(Number(store.minOrderAmount))}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FavoritesLink storeSlug={store.slug} />
            {(() => {
              const open = store.isOpen && isStoreOpenNow(store);
              return (
                <span className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-black border shadow-sm transition-all duration-200",
                  open
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 animate-pulse"
                    : "bg-red-50 border-red-200 text-red-700"
                )}>
                  {open ? "مفتوح" : "مغلق"}
                </span>
              );
            })()}
          </div>
        </div>

        {buildingName && (
          <div className="rounded-2xl bg-[#ECFDF5] border border-[#DCFCE7] text-[#15803D] text-xs px-4 py-2 font-extrabold flex items-center gap-2 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-ping shrink-0" />
            <span>توصيل لعمارة: {buildingName}</span>
          </div>
        )}
      </div>

      {/* Sticky Search and Categories */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100/80 shadow-sm p-4 space-y-3">
        <SearchBar />
        <CategoryScroller
          categories={categories.map((c) => ({ slug: c.slug, nameAr: c.nameAr }))}
          activeSlug={cat}
        />
      </div>

      <main className="p-4 space-y-6">
        {/* Quick Highlights Strip */}
        {!activeCategory && !q && !currentOffer && (
          <div className="no-scrollbar overflow-x-auto -mx-4 px-4 py-1">
            <div className="flex gap-2 w-max">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#DCFCE7] text-[10px] font-black text-[#15803D] shadow-sm">
                <Zap className="h-3 w-3" />
                <span>توصيل سريع</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-[10px] font-black text-[#F97316] shadow-sm">
                <Flame className="h-3 w-3" />
                <span>عروض شغالة</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-700 shadow-sm">
                <TrendingUp className="h-3 w-3" />
                <span>أكثر طلبًا</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-[10px] font-black text-purple-700 shadow-sm">
                <ShoppingBasket className="h-3 w-3" />
                <span>منتجات يومية</span>
              </div>
            </div>
          </div>
        )}

        {/* Offer filter banner */}
        {currentOffer && (
          <div className="rounded-2xl bg-orange-50 border border-orange-200 p-3.5 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Percent className="h-5 w-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-gray-900 truncate text-sm">
                  {currentOffer.title}
                </div>
                {currentOffer.discountPct != null && (
                  <div className="text-xs text-orange-700 font-bold mt-0.5">
                    خصم حتى {currentOffer.discountPct}%
                  </div>
                )}
              </div>
            </div>
            <Link
              href={`/s/${store.slug}${bcode ? `?bcode=${bcode}` : ""}`}
              className="text-xs text-orange-700 font-black shrink-0 hover:underline"
            >
              إلغاء
            </Link>
          </div>
        )}

        {/* Today's offers section */}
        {!activeCategory && !q && !currentOffer && activeOffers.length > 0 && (
          <section className="space-y-3.5">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <span>عروض اليوم</span>
              <Flame className="h-4 w-4 text-orange-500" />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeOffers.map((o) => (
                <Link
                  key={o.id}
                  href={`/s/${store.slug}?offer=${o.id}${bcode ? `&bcode=${bcode}` : ""}`}
                  className="rounded-2xl border border-orange-100 bg-white overflow-hidden flex hover:shadow-md transition-all duration-300 group shadow-sm"
                >
                  <div className="w-1/3 aspect-square bg-slate-50 relative shrink-0">
                    {o.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={o.imageUrl}
                        alt={o.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-orange-200 bg-orange-50/50">
                        <Percent className="h-8 w-8" />
                      </div>
                    )}
                    {o.discountPct != null && (
                      <span className="absolute top-2 right-2 rounded-full bg-[#F97316] text-white text-[10px] font-black px-2 py-0.5 shadow-sm">
                        خصم {o.discountPct}%
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#F97316] transition-colors truncate">
                      {o.title}
                    </h3>
                    {o.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-normal font-medium">
                        {o.description}
                      </p>
                    )}
                    <span className="text-[10px] font-black text-[#F97316] mt-2 inline-flex items-center gap-1">
                      <span>عرض المنتجات</span>
                      <span>←</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Emergency / quick order section */}
        {!activeCategory && !q && !currentOffer && emergencyProducts.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between gap-4 bg-gradient-to-l from-[#ECFDF5] to-transparent p-2 rounded-2xl">
              <div>
                <h2 className="text-base font-black text-slate-950 flex items-center gap-1.5">
                  <span>محتاجه بسرعة</span>
                  <Zap className="h-4 w-4 text-[#16A34A]" />
                </h2>
                <p className="text-[10px] text-slate-500 font-extrabold mt-0.5">أهم المنتجات اللي بتتطلب بسرعة</p>
              </div>
              <AddAllButton
                products={emergencyProducts}
                storeSlug={store.slug}
                buildingCode={bcode}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {emergencyProducts.slice(0, 4).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  storeSlug={store.slug}
                  buildingCode={bcode}
                />
              ))}
            </div>
          </section>
        )}

        {/* Main product grid */}
        <section className="space-y-3.5">
          {activeCategory && (
            <h2 className="text-base font-black text-slate-900">
              {activeCategory.nameAr}
            </h2>
          )}
          {q && (
            <p className="text-xs text-slate-500 font-extrabold">
              نتائج البحث عن &quot;{q}&quot;
            </p>
          )}
          {productCards.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl bg-white">
              مفيش منتجات هنا لسه
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {productCards.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  storeSlug={store.slug}
                  buildingCode={bcode}
                />
              ))}
            </div>
          )}
        </section>

        {/* Custom request card */}
        <section>
          <div className="rounded-2xl bg-[#ECFDF5] border border-[#DCFCE7] p-4 flex items-center gap-4 shadow-sm shadow-green-600/5">
            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
              <MessageSquare className="h-6 w-6 text-[#16A34A]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-slate-900 text-sm">مش لاقي اللي بتدور عليه؟</div>
              <div className="text-xs text-slate-500 font-bold mt-0.5">
                اكتب طلبك الخاص وصاحب البقال هيوفرهولك فوراً
              </div>
            </div>
            <Link
              href={`/s/${store.slug}/custom-request${bcode ? `?bcode=${bcode}` : ""}`}
              className="shrink-0 rounded-xl bg-[#16A34A] text-white text-xs font-black px-4 py-2.5 hover:bg-[#15803D] transition-colors shadow-sm"
            >
              اكتب طلبك
            </Link>
          </div>
        </section>

        {/* Powered by Baqal Branding Footer */}
        <section className="pt-8 pb-4 text-center space-y-1.5 border-t border-slate-200/60">
          <div className="font-extrabold text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <span>مشغل بواسطة</span>
            <span className="bg-[#16A34A] text-white font-black px-1.5 py-0.5 rounded-lg text-[9px] shadow-sm">بقال</span>
          </div>
        </section>
      </main>

      <FloatingCart storeSlug={store.slug} buildingCode={bcode} />
      <BottomNav storeSlug={store.slug} />
    </div>
  );
}
