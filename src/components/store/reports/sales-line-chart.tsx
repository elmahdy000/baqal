"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";

type Row = { date: string; revenue: number; orderCount: number };

export function SalesLineChart({ data }: { data: Row[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "dd MMM", { locale: arEG }),
  }));

  return (
    <div dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value, name) => {
              const n = Number(value ?? 0);
              if (name === "revenue") return [`${n.toFixed(2)} ج.م`, "المبيعات"];
              return [String(n), "الطلبات"];
            }}
            labelStyle={{ direction: "rtl" }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#16A34A"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="orderCount"
            stroke="#F97316"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
