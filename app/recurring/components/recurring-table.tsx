"use client";

import Link from "next/link";
import type { RecurringItem } from "@/lib/recurring";

export default function RecurringTable({
  rules = [],
}: {
  rules?: RecurringItem[];
  meta?: any;
}) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <p className="text-sm text-gray-600">No recurring rules.</p>
        <Link
          href="/recurring/create"
          className="inline-flex mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Create your first recurring rule
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-700">
          <tr>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Template Invoice</th>
            <th className="px-4 py-3">Frequency</th>
            <th className="px-4 py-3">Interval</th>
            <th className="px-4 py-3">Next Run</th>
            <th className="px-4 py-3">Active</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-4 py-3 font-medium">
                {r.client?.name || r.clientId}
              </td>
              <td className="px-4 py-3">
                {r.templateInvoice?.invoiceNumber ||
                  r.templateInvoiceId ||
                  "-"}
              </td>
              <td className="px-4 py-3">{r.frequency}</td>
              <td className="px-4 py-3">{r.interval}</td>
              <td className="px-4 py-3 text-gray-600">
                {r.nextRunAt ? new Date(r.nextRunAt).toLocaleString("id-ID") : "-"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {r.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
