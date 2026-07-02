import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StoreNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-bold">الصفحة مش موجودة</h2>
      <Button asChild>
        <Link href="/store">لوحة البقالة</Link>
      </Button>
    </div>
  );
}
