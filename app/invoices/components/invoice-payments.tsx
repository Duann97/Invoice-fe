// app/invoices/components/invoice-payments.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import PaymentForm from "@/app/payments/components/payment-form";
import type { Payment } from "@/app/payments/schema";

function toNumber(v: any) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

type Props = {
  invoiceId: string;
  invoiceTotal?: string | number; // optional buat display paid summary
};

export default function InvoicePayments({ invoiceId, invoiceTotal }: Props) {
  const token = useMemo(() => getToken(), []);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setErr(null);
      setLoading(true);

      const t = token ?? "";
      if (!t) {
        setPayments([]);
        setErr("Token tidak ada. Silakan login ulang.");
        return;
      }

      const res = await api.get(
        `/payments?invoiceId=${encodeURIComponent(invoiceId)}&page=1&limit=50`,
        {
          headers: { Authorization: `Bearer ${t}` },
        }
      );

      // support 2 kemungkinan:
      // A) { message, data: Payment[], meta }
      // B) { message, data: { data: Payment[], meta } }
      const raw = res.data?.data ?? res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : [];
      setPayments(list);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal load payments";
      setErr(msg);

      if (status === 401) {
        clearToken();
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const totalPaid = payments.reduce((s, p) => s + toNumber(p.amount), 0);
  const invTotal =
    invoiceTotal !== undefined ? toNumber(invoiceTotal) : undefined;
  const remaining =
    invTotal !== undefined ? Math.max(invTotal - totalPaid, 0) : undefined;

  const removePayment = async (id: string) => {
    try {
      const t = token ?? "";
      await api.delete(`/payments/${id}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      await fetchPayments();
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal delete payment";
      setErr(msg);

      if (status === 401) {
        clearToken();
        window.location.href = "/login";
      }
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Payments</h3>
          <p className="text-sm text-gray-600">
            Total paid:{" "}
            <span className="font-medium">
              {totalPaid.toLocaleString("id-ID")}
            </span>
            {invTotal !== undefined ? (
              <>
                {" "}
                / Invoice total:{" "}
                <span className="font-medium">
                  {invTotal.toLocaleString("id-ID")}
                </span>
              </>
            ) : null}
          </p>

          {remaining !== undefined ? (
            <p className="text-sm text-gray-600">
              Remaining:{" "}
              <span className="font-medium">
                {remaining.toLocaleString("id-ID")}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="rounded-xl border p-4">
        <PaymentForm
          invoiceId={invoiceId}
          maxAmount={remaining}
          onCreated={async () => {
            await fetchPayments();
          }}
        />
      </div>

      {loading ? (
        <div className="text-sm text-gray-600">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="text-sm text-gray-600">Belum ada payment.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Paid At</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Notes</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{String(p.paidAt).slice(0, 10)}</td>
                  <td className="px-3 py-2">
                    {toNumber(p.amount).toLocaleString("id-ID")}
                  </td>
                  <td className="px-3 py-2">{p.method ?? "-"}</td>
                  <td className="px-3 py-2">{p.notes ?? "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="rounded-lg border px-3 py-1 text-red-600"
                      onClick={() => removePayment(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
