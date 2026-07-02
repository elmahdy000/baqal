"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type CatItem = { slug: string; nameAr: string };

export function CategoryScroller({
  categories,
  activeSlug,
}: {
  categories: CatItem[];
  activeSlug?: string;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const bcode = sp.get("bcode");
  const q = sp.get("q");

  function href(slug?: string) {
    const params = new URLSearchParams();
    if (bcode) params.set("bcode", bcode);
    if (q) params.set("q", q);
    if (slug) params.set("cat", slug);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const items = [{ slug: "", nameAr: "الكل" }, ...categories];

  return (
    <div className="no-scrollbar overflow-x-auto -mx-4 px-4">
      <div className="flex gap-2 w-max">
        {items.map((c) => {
          const isActive = (c.slug || "") === (activeSlug || "");
          return (
            <Link
              key={c.slug || "all"}
              href={href(c.slug || undefined)}
              className={cn(
                "shrink-0 rounded-full px-4.5 py-1.5 text-xs font-black transition-all duration-200 border",
                isActive
                  ? "bg-[#16A34A] text-white shadow-md shadow-green-600/10 border-[#16A34A]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              {c.nameAr}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
