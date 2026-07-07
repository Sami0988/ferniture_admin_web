'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MonthlyRevenue } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface RevenueBarChartProps {
  data: MonthlyRevenue[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-surface p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueBarChart({ data }: RevenueBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#71717A' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#71717A' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="wood" name="Wood" fill="#5C3A21" radius={[4, 4, 0, 0]} />
        <Bar dataKey="aluminum" name="Aluminum" fill="#8C929B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="design" name="Interior Design" fill="#B8860B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
