import { InvoiceStatus } from "../type"

export default function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
    SENT: "bg-blue-50 text-blue-700 border-blue-200",
    PENDING: "bg-yellow-50 text-yellow-800 border-yellow-200",
    PAID: "bg-green-50 text-green-700 border-green-200",
    OVERDUE: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-gray-50 text-gray-500 border-gray-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  );
}
