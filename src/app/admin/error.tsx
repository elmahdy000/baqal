"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminError({
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
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-bold">حصلت مشكلة</h2>
      <p className="text-sm text-gray-500">فيه خطأ في لوحة الإدارة.</p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>حاول تاني</Button>
        <Button variant="outline" asChild>
          <Link href="/admin">لوحة الإدارة</Link>
        </Button>
      </div>
    </div>
  );
}
