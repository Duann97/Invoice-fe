"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import type { Payment } from "../schema"

function toNumber(v: any) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => getToken(), []);
  const [rows, setRows] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    if (!sp.get("limit")) sp.set("limit", "10");
    if (!sp.get("page")) sp.set("page", "1");
    return sp.toString();
  }, [searchParams]);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    const run = async () => {
      try {
        setErr(null);
        setLoading(true);

        const res = await api.get(`/payments?${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // support 2 kemungkinan response:
        // A) { message, data: Payment[], meta }
        // B) { message, data: { data: Payment[], meta } }
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
          e?.response?.data?.message || e?.message || "Gagal load payments";
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
  }, [token, qs, router]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="mt-1 text-sm text-gray-600">Daftar pembayaran.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/invoices"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Go to Invoices
          </Link>
        </div>
      </div>

      {err ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border bg-white p-6">
        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-600">Belum ada payment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr className="border-b">
                  <th className="py-2">Paid At</th>
                  <th className="py-2">Invoice</th>
                  <th className="py-2 text-right">Amount</th>
                  
                  
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="py-2">{String(p.paidAt).slice(0, 10)}</td>
                    <td className="py-2">
                      <Link href={`/invoices/${p.invoiceId}`} className="underline">
                        {p.invoiceId.slice(0, 10)}...
                      </Link>
                    </td>
                    <td className="py-2 text-right">
                      {toNumber(p.amount).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2">{p.method ?? "-"}</td>
                    <td className="py-2">{p.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta ? (
              <div className="mt-4 text-xs text-gray-600">
                Page {meta.page ?? "-"} / {meta.totalPages ?? "-"} • Total{" "}
                {meta.total ?? "-"}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
