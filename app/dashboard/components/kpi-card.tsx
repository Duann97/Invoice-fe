type Props = {
  title: string;
  value: string;
  subtitle?: string;
  loading?: boolean;
};

export default function KpiCard({ title, value, subtitle, loading }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-gray-600">{title}</p>

      {loading ? (
        <div className="mt-2 h-8 w-2/3 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      )}

      {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
