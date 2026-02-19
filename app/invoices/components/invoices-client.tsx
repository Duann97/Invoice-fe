"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string | number;
  dueDate: string;
  client?: { name?: string } | null;
};

function toNumber(v: any) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function formatIDR(value: any) {
  return toNumber(value).toLocaleString("id-ID");
}

function Badge({ status }: { status: string }) {
  const s = String(status || "DRAFT").toUpperCase();

  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide";

  const cls =
    s === "PAID"
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
      : s === "SENT"
      ? "border-sky-300/20 bg-sky-400/10 text-sky-200"
      : s === "OVERDUE"
      ? "border-rose-300/20 bg-rose-400/10 text-rose-200"
      : s === "CANCELLED"
      ? "border-white/15 bg-white/[0.06] text-white/70"
      : "border-white/15 bg-white/[0.06] text-white/70";

  return <span className={`${base} ${cls}`}>{s}</span>;
}

export default function InvoicesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => getToken(), []);
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const page = useMemo(() => {
    const p = Number(searchParams?.get("page") || "1");
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);

  const limit = useMemo(() => {
    const l = Number(searchParams?.get("limit") || "10");
    return Number.isFinite(l) && l > 0 ? l : 10;
  }, [searchParams]);

  const q = useMemo(() => (searchParams?.get("q") || "").trim(), [searchParams]);

  const [searchText, setSearchText] = useState(q);

  useEffect(() => {
    setSearchText(q);
  }, [q]);

  const buildQS = (next: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    Object.entries(next).forEach(([k, v]) => {
      if (!v) sp.delete(k);
      else sp.set(k, v);
    });
    if (!sp.get("limit")) sp.set("limit", String(limit));
    if (!sp.get("page")) sp.set("page", "1");
    return sp.toString();
  };

  // ✅ Debounce: ketik langsung auto filter (tanpa harus klik Search)
  useEffect(() => {
    const nextQ = searchText.trim();

    // kalau sama dengan query di URL, jangan update (hindari loop)
    if (nextQ === q) return;

    const t = setTimeout(() => {
      const qs = buildQS({ q: nextQ, page: "1" });
      router.replace(`/invoices?${qs}`);
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, q, router, limit, searchParams]);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    const run = async () => {
      try {
        setErr(null);
        setLoading(true);

        const sp = new URLSearchParams();
        sp.set("page", String(page));
        sp.set("limit", String(limit));
        if (q) sp.set("q", q);

        const res = await api.get(`/invoices?${sp.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = res.data?.data ?? res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : [];
        const m = res.data?.meta ?? raw?.meta ?? null;

        setRows(list);
        setMeta(m);
      } catch (e: any) {
        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message || e?.message || "Gagal load invoices";
        setErr(msg);

        if (status === 401) {
          clearToken();
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token, page, limit, q, router]);

  const onSearchSubmit = (e: React.FormEvent) => {
    // masih ada supaya UI gak berubah,
    // tapi sekarang sebenernya gak perlu dipencet karena debounce sudah jalan
    e.preventDefault();
    const nextQ = searchText.trim();
    const qs = buildQS({ q: nextQ, page: "1" });
    router.replace(`/invoices?${qs}`);
  };

  const goPage = (nextPage: number) => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    sp.set("page", String(nextPage));
    if (!sp.get("limit")) sp.set("limit", String(limit));
    router.replace(`/invoices?${sp.toString()}`);
  };

  const currentPage = meta?.page ?? page;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Invoices</h1>
          <p className="mt-1 text-sm text-white/60">Kelola invoice kamu.</p>
        </div>

        <Link
          href="/invoices/create"
          className="rounded-xl bg-black px-4 py-2 text-sm text-white"
        >
          + Create Invoice
        </Link>
      </div>

      <form
        onSubmit={onSearchSubmit}
        className="mt-5 rounded-2xl border border-white/10 p-4"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <label className="text-xs text-white/60">Search</label>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder="Cari invoice number / nama client..."
            />
          </div>

         

          <button
            type="button"
            onClick={() => {
              setSearchText("");
              const sp = new URLSearchParams(searchParams?.toString() || "");
              sp.delete("q");
              sp.set("page", "1");
              if (!sp.get("limit")) sp.set("limit", String(limit));
              router.replace(`/invoices?${sp.toString()}`);
            }}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/80 hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </form>

      {err ? (
        <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {err}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-white/10 p-6">
        {loading ? (
          <div className="text-sm text-white/60">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-white/60">
            Tidak ada invoice{q ? ` untuk pencarian "${q}"` : ""}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-fixed w-full text-sm text-white/90">
              <thead className="text-left text-white/60">
                <tr className="border-b border-white/10">
                  <th className="py-3 w-14">No</th>
                  <th className="py-3 ">Client</th>
                  <th className="py-3 w-44">Status</th>
                  <th className="py-3 w-44">TotalDue</th>
                  <th className="py-3 w-28 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((inv, idx) => (
                  <tr
                    key={inv.id}
                    className="border-b border-white/10 last:border-b-0"
                  >
                    <td className="py-3">
                      {(currentPage - 1) * limit + (idx + 1)}
                    </td>

                    <td className="py-3">
                      <div className="font-semibold text-white">
                        {inv.client?.name || "-"}
                      </div>
                      <div className="text-xs text-white/60">
                        {inv.invoiceNumber}
                      </div>
                    </td>

                    <td className="py-3">
                      <Badge status={inv.status} />
                    </td>

                    <td className="py-3">
                      <div className="font-semibold">
                        Rp {formatIDR(inv.total)}
                      </div>
                      <div className="text-xs text-white/60">
                        {String(inv.dueDate).slice(0, 10)}
                      </div>
                    </td>

                    <td className="py-3">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
                        >
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta ? (
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/60">
                <div>
                  Page {meta.page ?? "-"} / {meta.totalPages ?? "-"} • Total{" "}
                  {meta.total ?? "-"}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 disabled:opacity-50"
                    onClick={() => goPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    type="button"
                  >
                    Prev
                  </button>

                  <span className="rounded-xl bg-black px-3 py-1.5 text-white">
                    {currentPage}
                  </span>

                  <button
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 disabled:opacity-50"
                    onClick={() => goPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
