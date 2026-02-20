"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getClients, type ClientItem } from "@/lib/clients";

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams?.get("page") || 1);
  const limit = Number(searchParams?.get("limit") || 10);

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [q, setQ] = useState(searchParams?.get("q") || "");
  const [meta, setMeta] = useState<any>(null);

  const fetchData = useCallback(
    async (keyword?: string, nextPage?: number) => {
      setLoading(true);
      try {
        const data = await getClients({
          q: keyword,
          page: nextPage ?? page,
          limit,
        });

        const items = Array.isArray(data) ? data : data.items;
        const m = Array.isArray(data) ? null : (data as any).meta ?? null;

        setClients(items || []);
        setMeta(m);
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    fetchData(q.trim() || undefined, page);
  }, [fetchData, page]); // q sudah di-handle debounce

  // ✅ Debounce search: ketik langsung filter (tanpa harus klik Search)
  const firstRun = useRef(true);
  useEffect(() => {
    // biar tidak double-fetch barengan dengan initial fetchData()
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const t = setTimeout(() => {
      const keyword = q.trim() || undefined;

      // reset page ke 1 ketika search berubah (pagination pattern kayak invoices)
      const sp = new URLSearchParams(searchParams?.toString() || "");
      if (keyword) sp.set("q", keyword);
      else sp.delete("q");
      sp.set("page", "1");
      if (!sp.get("limit")) sp.set("limit", String(limit));

      router.push(`/clients?${sp.toString()}`);

      // fetch page 1
      fetchData(keyword, 1);
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filteredCount = useMemo(() => clients.length, [clients]);

  const canPrev = (meta?.page ?? page) > 1;
  const totalPages = meta?.totalPages ?? 1;
  const canNext = (meta?.page ?? page) < totalPages;

  const goPage = (nextPage: number) => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    if (q.trim()) sp.set("q", q.trim());
    else sp.delete("q");

    sp.set("page", String(nextPage));
    sp.set("limit", String(limit));

    router.push(`/clients?${sp.toString()}`);
    fetchData(q.trim() || undefined, nextPage);
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Clients</h1>
            <p className="mt-1 text-sm text-gray-600">
              Kelola data client untuk kebutuhan invoice.
            </p>
          </div>

          <Link
            href="/clients/create"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Create Client
          </Link>
        </div>

        <div className="rounded-2xl border bg-white p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 w-full md:max-w-md">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Search name / email / phone..."
            />
          </div>

          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredCount}</span>{" "}
            client(s)
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
            Loading...
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <p className="text-sm text-gray-600">Belum ada client.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.email || "-"}</td>
                    <td className="px-4 py-3">{c.phone || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(c.updatedAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/clients/${c.id}`}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-white"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ✅ ONLY ADD: pagination bar (style netral, ga ganggu table) */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
              <div className="text-xs text-gray-600">
                Page {meta?.page ?? page} / {totalPages} • Total{" "}
                {meta?.total ?? "-"}
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  disabled={!canPrev}
                  onClick={() => goPage((meta?.page ?? page) - 1)}
                >
                  Prev
                </button>
                <button
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  disabled={!canNext}
                  onClick={() => goPage((meta?.page ?? page) + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}