import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold text-gray-900">الصفحة مش موجودة</h1>
      <p className="max-w-md text-sm text-gray-500">
        الرابط ده مش موجود أو اتنقل. ارجع للرئيسية.
      </p>
      <Button asChild>
        <Link href="/">الرجوع للرئيسية</Link>
      </Button>
    </div>
  );
}
