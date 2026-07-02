"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  folder?: "products" | "logos";
  label?: string;
};

export function ImageUpload({
  value,
  onChange,
  folder = "products",
  label = "صورة",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "فشل رفع الصورة");
        return;
      }
      onChange(data.url);
      toast.success("تم رفع الصورة");
    } catch {
      toast.error("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void upload(f);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
          dragOver
            ? "border-green-500 bg-green-50"
            : "border-gray-200 bg-white"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="preview"
            className="h-32 w-32 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-md bg-gray-50 text-xs text-gray-400">
            بدون صورة
          </div>
        )}
        <div className="text-xs text-gray-500">
          اسحب الصورة هنا أو اضغط للاختيار (jpg / png / webp — أقل من 5MB)
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                جاري الرفع...
              </span>
            ) : (
              "اختر صورة"
            )}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => onChange("")}
            >
              مسح
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
