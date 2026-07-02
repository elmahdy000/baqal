"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, MapPin, Search, ArrowRight, QrCode, Shield, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatEGP } from "@/lib/utils";

interface SimpleStore {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  deliveryFee: number;
  minOrderAmount: number;
  isOpen: boolean;
}

interface AreaData {
  id: string;
  name: string;
  nameAr: string;
  stores: SimpleStore[];
}

export function StoreSelector({ areas }: { areas: AreaData[] }) {
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentStores, setRecentStores] = useState<any[]>([]);

  // Load recently visited stores from localStorage
  useEffect(() => {
    try {
      const storageKey = "baqal_visited_stores";
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setRecentStores(JSON.parse(raw));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Find currently selected area data
  const activeArea = areas.find((a) => a.id === selectedAreaId);

  // Get stores to display (either from selected area or all stores if no area selected)
  let displayStores: SimpleStore[] = [];
  if (activeArea) {
    displayStores = activeArea.stores;
  } else {
    // Unique list of all stores across all areas
    const allStoresMap = new Map<string, SimpleStore>();
    areas.forEach((area) => {
      area.stores.forEach((store) => {
        allStoresMap.set(store.id, store);
      });
    });
    displayStores = Array.from(allStoresMap.values());
  }

  // Filter stores by search query
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase();
    displayStores = displayStores.filter((store) => {
      const name = store.name.toLowerCase();
      const nameAr = (store.nameAr || "").toLowerCase();
      return name.includes(query) || nameAr.includes(query);
    });
  }

  return (
    <div className="space-y-6 px-4 py-6" dir="rtl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-6 -translate-y-6">
          <Store className="h-64 w-64" />
        </div>
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-black">
            <Sparkles className="h-3 w-3" />
            <span>تسوق ذكي وسريع</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">ابحث عن بقالتك القريبة</h2>
          <p className="text-xs text-green-100 font-medium leading-relaxed max-w-sm">
            اختر منطقتك أو امسح كود الـ QR الخاص بالبقالة أو العمارة للطلب مباشرة وسنقوم بتوصيله لباب شقتك.
          </p>
        </div>
      </div>

      {/* Scanned/Recent Stores Section */}
      {recentStores.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800">
            <QrCode className="h-4.5 w-4.5 text-green-600" />
            <h3 className="font-extrabold text-sm">متاجر قمت بزيارتها مؤخراً</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recentStores.map((store) => (
              <Link key={store.id} href={`/s/${store.slug}`}>
                <Card className="border border-slate-100 hover:border-green-300 bg-white transition-all shadow-sm duration-200">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                        <Store className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {store.nameAr || store.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">توصيل: {formatEGP(store.deliveryFee)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Area & Search Controls */}
      <div className="bg-white border border-slate-100/80 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-green-600" />
            <span>اختر المنطقة لتصفية المتاجر القريبة</span>
          </label>
          <select
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-green-600 bg-slate-50/50"
          >
            <option value="">كل المناطق المتاحة</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nameAr} ({area.stores.length} بقال)
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <Input
            placeholder="ابحث باسم البقالة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-3 pr-10 h-10.5 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Stores List */}
      <div className="space-y-3">
        <h3 className="font-black text-sm text-slate-800">
          {selectedAreaId ? `المتاجر القريبة في ${activeArea?.nameAr}` : "كل المتاجر المتاحة"} ({displayStores.length})
        </h3>

        {displayStores.length === 0 ? (
          <Card className="border border-slate-100 text-center py-12 bg-white">
            <CardContent className="space-y-2">
              <Store className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">مفيش متاجر متوفرة</h4>
              <p className="text-xs text-slate-400">
                جرب تغيير تصفية المنطقة أو ابحث بكلمات مختلفة.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayStores.map((store) => (
              <Link key={store.id} href={`/s/${store.slug}`}>
                <Card className="border border-slate-100 hover:border-green-200 bg-white transition-all shadow-sm duration-200 hover:shadow-md">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-green-55/10 text-green-600 flex items-center justify-center shrink-0 border border-green-50">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {store.nameAr || store.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>التوصيل: {formatEGP(store.deliveryFee)}</span>
                          <span>•</span>
                          <span>أقل طلب: {formatEGP(store.minOrderAmount)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                          store.isOpen
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                            : "bg-red-50 border-red-100 text-red-700"
                        }`}
                      >
                        {store.isOpen ? "مفتوح" : "مغلق"}
                      </span>
                      <div className="flex items-center gap-0.5 text-[10px] font-bold text-green-600">
                        <span>اطلب الآن</span>
                        <ArrowRight className="h-3 w-3 transform rotate-180" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
