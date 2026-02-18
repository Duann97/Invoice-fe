"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Client, InvoiceStatus } from "../type";

const STATUSES: (InvoiceStatus | "ALL")[] = ["ALL", "DRAFT", "SENT", "PENDING", "PAID", "OVERDUE", "CANCELLED"];

function setParam(sp: URLSearchParams, key: string, value: string) {
  if (!value || value === "ALL") sp.delete(key);
  else sp.set(key, value);
}

export default function InvoicesFilters({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = useMemo(() => {
    const q = searchParams.get("q") ?? "";
    const status = (searchParams.get("status") as any) ?? "ALL";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";
    const clientId = searchParams.get("clientId") ?? "";
    const limit = searchParams.get("limit") ?? "10";
    return { q, status, dateFrom, dateTo, clientId, limit };
  }, [searchParams]);

  const [q, setQ] = useState(initial.q);
  const [status, setStatus] = useState(initial.status);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [clientId, setClientId] = useState(initial.clientId);
  const [limit, setLimit] = useState(initial.limit);

  const apply = () => {
    const sp = new URLSearchParams(searchParams.toString());
    setParam(sp, "q", q.trim());
    setParam(sp, "status", status);
    setParam(sp, "dateFrom", dateFrom);
    setParam(sp, "dateTo", dateTo);
    setParam(sp, "clientId", clientId);
    setParam(sp, "limit", limit);
    sp.set("page", "1"); // reset page
    router.push(`${pathname}?${sp.toString()}`);
  };

  const reset = () => {
    router.push(pathname);
  };

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="grid gap-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="text-xs text-gray-600">Search (invoice number / client)</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="INV-001 / PT Sinar..."
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All" : s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-600">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-600">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Limit</label>
          <select
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            {["10", "20", "50", "100"].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button onClick={apply} className="rounded-xl bg-black px-4 py-2 text-sm text-white">
          Apply
        </button>
        <button onClick={reset} className="rounded-xl border px-4 py-2 text-sm">
          Reset
        </button>
      </div>
    </div>
  );
}
