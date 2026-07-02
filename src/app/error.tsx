"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">حصلت مشكلة</h1>
      <p className="max-w-md text-sm text-gray-500">
        فيه خطأ غير متوقع. جرّب تاني أو ارجع للصفحة الرئيسية.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>حاول تاني</Button>
        <Button variant="outline" asChild>
          <Link href="/">الرجوع للرئيسية</Link>
        </Button>
      </div>
    </div>
  );
}
