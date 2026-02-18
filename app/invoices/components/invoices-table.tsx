import Link from "next/link";
import InvoiceStatusBadge from "./invoice-status-badge";
import { Invoice } from "../type";

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("id-ID");
  } catch {
    return d;
  }
}

export default function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  if (!invoices.length) {
    return <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">No invoices found.</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="grid grid-cols-12 border-b bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-700">
        <div className="col-span-3">Invoice</div>
        <div className="col-span-3">Client</div>
        <div className="col-span-2">Issue</div>
        <div className="col-span-2">Due</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1 text-right">Total</div>
      </div>

      {invoices.map((inv) => (
        <Link
          key={inv.id}
          href={`/invoices/${inv.id}`}
          className="grid grid-cols-12 items-center px-4 py-3 text-sm hover:bg-gray-50"
        >
          <div className="col-span-3">
            <div className="font-medium">{inv.invoiceNumber}</div>
            <div className="text-xs text-gray-500">{inv.id.slice(0, 10)}...</div>
          </div>

          <div className="col-span-3">
            <div className="font-medium">{inv.client?.name ?? "-"}</div>
            <div className="text-xs text-gray-500">{inv.client?.email ?? ""}</div>
          </div>

          <div className="col-span-2 text-gray-700">{fmtDate(inv.issueDate)}</div>
          <div className="col-span-2 text-gray-700">{fmtDate(inv.dueDate)}</div>

          <div className="col-span-1">
            <InvoiceStatusBadge status={inv.status} />
          </div>

          <div className="col-span-1 text-right font-medium">{String(inv.total)}</div>
        </Link>
      ))}
    </div>
  );
}
