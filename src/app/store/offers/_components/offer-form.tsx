"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createOffer, updateOffer, deleteOffer } from "@/server/actions/store";
import { formatEGP } from "@/lib/utils";

export type OfferFormProduct = {
  id: string;
  nameAr: string;
  price: number;
  imageUrl?: string | null;
};

export type OfferFormInitial = {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  discountPct?: number | null;
  startsAt: string;
  endsAt?: string | null;
  isActive: boolean;
  productIds: string[];
};

function toLocalInputValue(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function OfferForm({
  offerId,
  initial,
  products,
}: {
  offerId?: string;
  initial?: OfferFormInitial;
  products: OfferFormProduct[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [discountPct, setDiscountPct] = useState<string>(
    initial?.discountPct != null ? String(initial.discountPct) : ""
  );
  const [startsAt, setStartsAt] = useState<string>(
    initial?.startsAt ? toLocalInputValue(initial.startsAt) : toLocalInputValue(new Date())
  );
  const [endsAt, setEndsAt] = useState<string>(
    initial?.endsAt ? toLocalInputValue(initial.endsAt) : ""
  );
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initial?.productIds ?? [])
  );
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.trim().toLowerCase();
    return products.filter((p) => p.nameAr.toLowerCase().includes(q));
  }, [products, query]);

  function toggleProduct(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        discountPct: discountPct === "" ? null : Number(discountPct),
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive,
        productIds: Array.from(selected),
      };
      const res = offerId
        ? await updateOffer(offerId, payload)
        : await createOffer(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(offerId ? "تم التحديث" : "تم إضافة العرض");
      router.push("/store/offers");
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!offerId) return;
    if (!window.confirm("تأكيد حذف العرض؟")) return;
    startTransition(async () => {
      const res = await deleteOffer(offerId);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("تم الحذف");
        router.push("/store/offers");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="offer-title">عنوان العرض</Label>
        <Input
          id="offer-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عرض الأسبوع"
          required
        />
      </div>

      <div>
        <Label htmlFor="offer-description">وصف قصير (اختياري)</Label>
        <textarea
          id="offer-description"
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="offer-imageUrl">رابط الصورة (اختياري)</Label>
          <Input
            id="offer-imageUrl"
            type="url"
            value={imageUrl ?? ""}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            dir="ltr"
          />
        </div>
        <div>
          <Label htmlFor="offer-discount">نسبة الخصم %</Label>
          <Input
            id="offer-discount"
            type="number"
            min={0}
            max={100}
            value={discountPct}
            onChange={(e) => setDiscountPct(e.target.value)}
            placeholder="10"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="offer-startsAt">يبدأ في</Label>
          <Input
            id="offer-startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="offer-endsAt">ينتهي في (اختياري)</Label>
          <Input
            id="offer-endsAt"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        العرض مفعل
      </label>

      <div>
        <Label>المنتجات في العرض ({selected.size})</Label>
        <div className="mt-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن منتج..."
          />
        </div>
        <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              مفيش منتجات
            </div>
          ) : (
            filtered.map((p) => {
              const checked = selected.has(p.id);
              return (
                <label
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleProduct(p.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div className="h-10 w-10 shrink-0 rounded bg-gray-100 overflow-hidden">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.nameAr}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                      {p.nameAr}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatEGP(p.price)}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "جاري الحفظ..." : offerId ? "حفظ التعديلات" : "إضافة العرض"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/store/offers")}
          disabled={pending}
        >
          إلغاء
        </Button>
        {offerId && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={pending}
            className="ms-auto"
          >
            حذف العرض
          </Button>
        )}
      </div>
    </form>
  );
}
