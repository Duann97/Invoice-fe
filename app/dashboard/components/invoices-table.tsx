import Link from "next/link";

type Invoice = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  total: number | string;
  client?: { id: string; name: string } | null;
};

type Props = {
  invoices: Invoice[];
  loading?: boolean;
  compact?: boolean;
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

const badge = (status: Invoice["status"]) => {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border";
  switch (status) {
    case "PAID":
      return `${base} border-green-200 bg-green-50 text-green-700`;
    case "OVERDUE":
      return `${base} border-red-200 bg-red-50 text-red-700`;
    case "PENDING":
      return `${base} border-amber-200 bg-amber-50 text-amber-700`;
    case "SENT":
      return `${base} border-blue-200 bg-blue-50 text-blue-700`;
    case "DRAFT":
      return `${base} border-gray-200 bg-gray-50 text-gray-700`;
    case "CANCELLED":
      return `${base} border-gray-200 bg-white text-gray-500`;
    default:
      return base;
  }
};

export default function InvoicesTable({ invoices, loading, compact }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-10 animate-pulse rounded bg-gray-100" />
        <div className="h-10 animate-pulse rounded bg-gray-100" />
        <div className="h-10 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
        Tidak ada invoice.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Invoice</th>
            {!compact && (
              <th className="px-3 py-2 text-left font-medium">Client</th>
            )}
            <th className="px-3 py-2 text-left font-medium">Status</th>
            <th className="px-3 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-t">
              <td className="px-3 py-2">
                <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">
                  {inv.invoiceNumber}
                </Link>
                <div className="text-xs text-gray-500">
                  Due: {new Date(inv.dueDate).toLocaleDateString("id-ID")}
                </div>
              </td>

              {!compact && (
                <td className="px-3 py-2">
                  {inv.client?.name ?? <span className="text-gray-500">-</span>}
                </td>
              )}

              <td className="px-3 py-2">
                <span className={badge(inv.status)}>{inv.status}</span>
              </td>
              <td className="px-3 py-2 text-right font-medium">
                {money(toNumber(inv.total))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
