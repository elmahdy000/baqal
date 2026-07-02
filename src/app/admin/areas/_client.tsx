"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, X, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createArea, updateArea, deleteArea } from "@/server/actions/admin";

type Area = {
  id: string;
  name: string;
  nameAr: string;
  city: string;
  buildingsCount: number;
};

type Values = { name: string; nameAr: string; city: string };

export function AreasClient({ areas }: { areas: Area[] }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {creating ? (
        <NewAreaForm
          pending={pending}
          onCancel={() => setCreating(false)}
          onSubmit={(values) => {
            startTransition(async () => {
              const res = await createArea(values);
              if (!res.ok) toast.error(res.error);
              else {
                toast.success("تم إضافة المنطقة");
                setCreating(false);
              }
            });
          }}
        />
      ) : (
        <div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            <span>منطقة جديدة</span>
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">الاسم (عربي)</th>
              <th className="px-4 py-3 font-medium">المدينة</th>
              <th className="px-4 py-3 font-medium">العمارات</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {areas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  لا توجد مناطق
                </td>
              </tr>
            ) : (
              areas.map((a) =>
                editingId === a.id ? (
                  <tr key={a.id}>
                    <td colSpan={5} className="p-3">
                      <EditRow
                        area={a}
                        pending={pending}
                        onCancel={() => setEditingId(null)}
                        onSubmit={(values) => {
                          startTransition(async () => {
                            const res = await updateArea(a.id, values);
                            if (!res.ok) toast.error(res.error);
                            else {
                              toast.success("تم تعديل المنطقة");
                              setEditingId(null);
                            }
                          });
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-3 text-gray-700">{a.nameAr || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{a.city || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{a.buildingsCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          onClick={() => setEditingId(a.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                          onClick={() => {
                            if (!confirm("حذف المنطقة؟")) return;
                            startTransition(async () => {
                              const res = await deleteArea(a.id);
                              if (!res.ok) toast.error(res.error);
                              else toast.success("تم الحذف");
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewAreaForm({
  pending,
  onSubmit,
  onCancel,
}: {
  pending: boolean;
  onSubmit: (v: Values) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, reset } = useForm<Values>({
    defaultValues: { name: "", nameAr: "", city: "" },
  });
  return (
    <form
      onSubmit={handleSubmit((v) => {
        onSubmit(v);
        reset();
      })}
      className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-3"
    >
      <div className="space-y-1">
        <Label htmlFor="areaName">الاسم</Label>
        <Input id="areaName" {...register("name", { required: true })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="areaNameAr">الاسم (عربي)</Label>
        <Input id="areaNameAr" {...register("nameAr")} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="areaCity">المدينة</Label>
        <Input id="areaCity" {...register("city")} />
      </div>
      <div className="md:col-span-3 flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4" />
          <span>إلغاء</span>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </div>
    </form>
  );
}

function EditRow({
  area,
  pending,
  onSubmit,
  onCancel,
}: {
  area: Area;
  pending: boolean;
  onSubmit: (v: Values) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit } = useForm<Values>({
    defaultValues: { name: area.name, nameAr: area.nameAr, city: area.city },
  });
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-3 md:grid-cols-4"
    >
      <Input {...register("name", { required: true })} placeholder="الاسم" />
      <Input {...register("nameAr")} placeholder="عربي" />
      <Input {...register("city")} placeholder="المدينة" />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          حفظ
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
