import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StorefrontNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <div className="text-xs tracking-widest text-gray-500 mb-3">/ 404</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          البقالة غير موجودة
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          الرابط اللي فتحته مش صحيح، أو البقالة تم إيقافها.
        </p>
        <Button asChild>
          <Link href="/">الرجوع للرئيسية</Link>
        </Button>
      </div>
    </div>
  );
}
