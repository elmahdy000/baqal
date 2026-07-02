"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getProfile, setProfile } from "@/lib/cart";
import { createCustomRequest } from "@/server/actions/customer";
import { ArrowRight, MessageSquare } from "lucide-react";

export default function CustomRequestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (p.name) setName(p.name);
    if (p.phone) setPhone(p.phone);
    setLoaded(true);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createCustomRequest({
        storeSlug: slug,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        text: text.trim(),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      // Persist profile locally
      setProfile({ ...getProfile(), name: name.trim(), phone: phone.trim() });
      toast.success("تم إرسال طلبك — البقال هيرد قريب");
      router.push(`/s/${slug}`);
    });
  }

  if (!loaded) {
    return <div className="p-6 text-center text-gray-500">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href={`/s/${slug}`} className="text-gray-500 hover:text-gray-900">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">مش لاقي المنتج؟</h1>
        </div>
      </header>

      <main className="p-4">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <CardTitle className="text-base">اكتب طلبك</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  اكتب اسم المنتج أو وصف، والبقال هيرد يقولك موجود ولا لأ
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="cr-name">الاسم</Label>
                <Input
                  id="cr-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسمك"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cr-phone">رقم الموبايل</Label>
                <Input
                  id="cr-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cr-text">اللي محتاجه</Label>
                <textarea
                  id="cr-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm"
                  placeholder="مثلاً: عايز شامبو دوف للشعر الجاف، أو 5 كيلو أرز مصري..."
                  required
                />
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
