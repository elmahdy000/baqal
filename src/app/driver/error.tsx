"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DriverError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[driver]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <div className="text-xs tracking-widest text-gray-500 mb-3">/ حصل خطأ</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          مقدرناش نجيب البيانات
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          جرّب تحديث الصفحة، ولو المشكلة استمرت اتصل بالإدارة.
        </p>
        <Button onClick={reset}>حاول تاني</Button>
      </div>
    </div>
  );
}
