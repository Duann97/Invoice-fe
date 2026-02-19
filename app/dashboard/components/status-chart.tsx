"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
} from "recharts";

type Props = {
  statusCounts: Record<string, number>;
  loading?: boolean;
};


const COLORS = ["#111827", "#6B7280", "#9CA3AF", "#10B981", "#F59E0B", "#EF4444"];

export default function StatusChart({ statusCounts, loading }: Props) {
  if (loading) {
    return <div className="h-64 w-full animate-pulse rounded-xl bg-gray-100" />;
  }

  const data = Object.entries(statusCounts)
    .map(([name, value]) => ({ name, value }))
    .filter((x) => x.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-64 w-full rounded-xl border bg-gray-50 flex items-center justify-center text-sm text-gray-600">
        Belum ada data invoice.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie dataKey="value" data={data} innerRadius={55} outerRadius={85}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
