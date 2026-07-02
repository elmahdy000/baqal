export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm text-gray-500">جاري التحميل...</div>
      </div>
    </div>
  );
}
