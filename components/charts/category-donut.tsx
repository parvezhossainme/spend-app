"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/currency";

export type DonutSlice = { name: string; value: number; color: string };

export function CategoryDonut({
  data,
  currency,
  height = 224,
}: {
  data: DonutSlice[];
  currency: string;
  height?: number;
}) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatMoney(Number(value), currency)}
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipItemStyle}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</span>
        <span className="num text-lg font-semibold">{formatMoney(total, currency)}</span>
      </div>
    </div>
  );
}

export const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--foreground)",
  fontSize: "12px",
  padding: "8px 10px",
};

export const tooltipItemStyle = { color: "var(--muted-foreground)" };
