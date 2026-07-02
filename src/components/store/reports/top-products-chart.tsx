"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Row = { name: string; quantity: number };

export function TopProductsChart({ data }: { data: Row[] }) {
  return (
    <div dir="ltr" className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 40, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 12 }}
            width={120}
          />
          <Tooltip
            formatter={(value) => [String(Number(value ?? 0)), "الكمية"]}
            labelStyle={{ direction: "rtl" }}
          />
          <Bar dataKey="quantity" fill="#16A34A" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
