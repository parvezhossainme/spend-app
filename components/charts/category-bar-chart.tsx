"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactMoney, formatMoney } from "@/lib/currency";
import { tooltipItemStyle, tooltipStyle } from "./category-donut";

export type BarDatum = { name: string; value: number; color: string };

export function CategoryBarChart({ data, currency }: { data: BarDatum[]; currency: string }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value) => formatCompactMoney(Number(value), currency)}
            stroke="var(--muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="var(--muted)"
            fontSize={11}
            width={92}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value), currency)}
            cursor={{ fill: "var(--card-elevated)" }}
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipItemStyle}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive={false} maxBarSize={22}>
            {data.map((datum) => (
              <Cell key={datum.name} fill={datum.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type GroupedBarDatum = { name: string; value: number };

export function SimpleBarChart({
  data,
  currency,
  color = "var(--accent)",
}: {
  data: GroupedBarDatum[];
  currency: string;
  color?: string;
}) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(value) => formatCompactMoney(Number(value), currency)}
            stroke="var(--muted)"
            fontSize={11}
            width={52}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value), currency)}
            cursor={{ fill: "var(--card-elevated)" }}
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipItemStyle}
          />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
