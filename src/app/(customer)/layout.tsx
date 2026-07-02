import { PwaRegister } from "@/components/customer/pwa-register";
import { CustomerPushPrompt } from "@/components/customer/customer-push-prompt";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl min-h-full pb-20">
      <PwaRegister />
      {children}
      
      {/* Powered by Baqal Branding Footer */}
      <div className="pt-8 pb-12 text-center space-y-1.5 border-t border-slate-100/80 mt-8 mx-4">
        <div className="font-extrabold text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
          <span>مشغل بواسطة</span>
          <span className="bg-[#16A34A] text-white font-black px-1.5 py-0.5 rounded-lg text-[9px] shadow-sm">بقال</span>
        </div>
      </div>

      <CustomerPushPrompt />
    </div>
  );
}
