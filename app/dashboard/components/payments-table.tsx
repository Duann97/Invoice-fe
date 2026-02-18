type Payment = {
  id: string;
  paidAt: string;
  amount: number | string;
  method?: string | null;
  invoice?: { id: string; invoiceNumber: string } | null;
};

type Props = {
  payments: Payment[];
  loading?: boolean;
};

function toNumber(v: number | string) {
  return typeof v === "number" ? v : Number(v) || 0;
}

const money = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function PaymentsTable({ payments, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-10 animate-pulse rounded bg-gray-100" />
        <div className="h-10 animate-pulse rounded bg-gray-100" />
        <div className="h-10 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
        Belum ada pembayaran.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Date</th>
            <th className="px-3 py-2 text-left font-medium">Invoice</th>
            <th className="px-3 py-2 text-left font-medium">Method</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-3 py-2">
                {new Date(p.paidAt).toLocaleDateString("id-ID")}
              </td>
              <td className="px-3 py-2 font-medium">
                {p.invoice?.invoiceNumber ?? "-"}
              </td>
              <td className="px-3 py-2 text-gray-600">{p.method ?? "-"}</td>
              <td className="px-3 py-2 text-right font-medium">
                {money(toNumber(p.amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
