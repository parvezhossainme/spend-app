"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactMoney, formatMoney } from "@/lib/currency";
import { tooltipItemStyle, tooltipStyle } from "./category-donut";

export type FlowDatum = { label: string; income: number; expense: number; net: number };

const INCOME = "var(--income)";
const EXPENSE = "var(--expense)";
const ACCENT = "var(--accent)";

export function FlowAreaChart({
  data,
  currency,
  showNet = true,
}: {
  data: FlowDatum[];
  currency: string;
  showNet?: boolean;
}) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={INCOME} stopOpacity={0.35} />
              <stop offset="100%" stopColor={INCOME} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EXPENSE} stopOpacity={0.3} />
              <stop offset="100%" stopColor={EXPENSE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(value) => formatCompactMoney(Number(value), currency)}
            stroke="var(--muted)"
            fontSize={11}
            width={52}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value, name) => [formatMoney(Number(value), currency), String(name)]}
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipItemStyle}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke={INCOME}
            fill="url(#incomeFill)"
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke={EXPENSE}
            fill="url(#expenseFill)"
            strokeWidth={2}
            isAnimationActive={false}
          />
          {showNet ? (
            <Line type="monotone" dataKey="net" name="Net" stroke={ACCENT} strokeWidth={2} dot={false} isAnimationActive={false} />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FlowLineChart({
  data,
  currency,
  dataKey,
  name,
  color,
}: {
  data: FlowDatum[];
  currency: string;
  dataKey: "income" | "expense" | "net";
  name: string;
  color: string;
}) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
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
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipItemStyle}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            name={name}
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: color }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
