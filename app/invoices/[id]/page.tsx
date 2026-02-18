"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type InvoiceDetail = {
  id: string;
  invoiceNumber?: string | number | null;
  status?: string | null;
  total?: number | string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  client?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  payments?: Array<{
    id: string;
    amount: number | string;
    paidAt?: string | null;
    method?: string | null;
    notes?: string | null;
  }>;
};

const toIdString = (v: unknown) => {
  if (!v) return "";
  if (Array.isArray(v)) return String(v[0] ?? "");
  return String(v);
};

const pickData = (res: any) => res?.data?.data ?? res?.data;

const toNum = (v: any) => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
};

const formatIDR = (v: any) => {
  const n = toNum(v);
  return n.toLocaleString("id-ID");
};

const fmtDate = (d?: string | null) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID");
  } catch {
    return "-";
  }
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();

  const token = useMemo(() => getToken(), []);
  const id = useMemo(() => toIdString((params as any)?.id), [params]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [inv, setInv] = useState<InvoiceDetail | null>(null);

  // create payment form state
  const [amount, setAmount] = useState<string>("");
  const [paidAt, setPaidAt] = useState<string>("");
  const [method, setMethod] = useState<string>("TRANSFER");
  const [notes, setNotes] = useState<string>("");

  const handle401 = () => {
    clearToken();
    router.replace("/login");
  };

  const fetchDetail = async () => {
    setErr(null);
    setInfo(null);

    if (!token) {
      router.replace("/login");
      return;
    }
    if (!id) {
      setLoading(false);
      setErr("Invoice id tidak ditemukan dari URL.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/invoices/${id}`);
      setInv(pickData(res));
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ??
        e?.message ??
        "Gagal load invoice detail.";
      setErr(msg);
      if (status === 401) handle401();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const status = (inv?.status ?? "").toUpperCase();
  const isPaid = status === "PAID";
  // ✅ OVERDUE dianggap sudah terkirim (sent-like)
  const isSentOrPaid = status === "SENT" || status === "PAID" || status === "OVERDUE";

  const totalPaid = useMemo(() => {
    const list = inv?.payments ?? [];
    return list.reduce((sum, p) => sum + toNum(p.amount), 0);
  }, [inv?.payments]);

  const invoiceTotal = toNum(inv?.total);
  const remaining = Math.max(invoiceTotal - totalPaid, 0);

  const onSendInvoice = async () => {
    setErr(null);
    setInfo(null);

    if (!token) {
      router.replace("/login");
      return;
    }
    if (!id) return;

    // guard FE: kalau SENT/PAID/OVERDUE, jangan send lagi
    if (isSentOrPaid) return;

    try {
      setSending(true);
      const res = await api.post(`/invoices/${id}/send`);
      const msg = res?.data?.message ?? "Invoice berhasil dikirim.";
      setInfo(msg);

      await fetchDetail();
    } catch (e: any) {
      const statusCode = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal send invoice.";
      setErr(msg);
      if (statusCode === 401) handle401();
    } finally {
      setSending(false);
    }
  };

  const onCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);

    if (!token) {
      router.replace("/login");
      return;
    }
    if (!id) return;

    if (isPaid) return;

    const amountNum = Number(String(amount).replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setErr("Amount harus angka > 0.");
      return;
    }

    try {
      setCreating(true);

      const payload: any = {
        invoiceId: id,
        amount: amountNum,
        paidAt: paidAt ? paidAt : undefined,
        notes: notes?.trim() || null,
        method: method || undefined,
      };

      const res = await api.post("/payments", payload);
      setInfo(res?.data?.message ?? "Payment berhasil dibuat.");

      setAmount("");
      setPaidAt("");
      setMethod("TRANSFER");
      setNotes("");

      await fetchDetail();
    } catch (e: any) {
      const statusCode = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal create payment.";
      setErr(msg);
      if (statusCode === 401) handle401();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Invoice Detail</h1>
          <p className="mt-1 text-sm text-white/70">
            Lihat invoice dan record payment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/invoices"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Back
          </Link>

          <button
            onClick={onSendInvoice}
            disabled={sending || isSentOrPaid}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
            title={isSentOrPaid ? "Invoice sudah SENT/PAID/OVERDUE" : "Send invoice"}
          >
            {sending ? "Sending..." : "Send"}
          </button>

          <Link
            href={`/invoices/${id}/edit`}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 border border-white/10"
          >
            Edit
          </Link>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      {info ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          {info}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        {loading ? (
          <div className="text-sm text-white/70">Loading...</div>
        ) : !inv ? (
          <div className="text-sm text-white/70">Invoice tidak ditemukan.</div>
        ) : (
          <div className="space-y-2 text-sm text-white/80">
            <div>
              Invoice Number:{" "}
              <span className="text-white">
                {String(inv.invoiceNumber ?? "-")}
              </span>
            </div>
            <div>
              Status:{" "}
              <span className="text-white font-semibold">{status || "-"}</span>
            </div>
            <div>
              Client: <span className="text-white">{inv.client?.name ?? "-"}</span>
            </div>
            <div>
              Client Email:{" "}
              <span className="text-white">{inv.client?.email ?? "-"}</span>
            </div>
            <div>
              Total: <span className="text-white">{formatIDR(inv.total)}</span>
            </div>
            <div>
              Issue Date:{" "}
              <span className="text-white">{fmtDate(inv.issueDate)}</span>
            </div>
            <div>
              Due Date: <span className="text-white">{fmtDate(inv.dueDate)}</span>
            </div>
          </div>
        )}
      </div>

      {/* PAYMENTS */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Payments</h2>
          <div className="mt-1 text-sm text-white/70">
            Total paid: {formatIDR(totalPaid)} / Invoice total: {formatIDR(invoiceTotal)}
            <br />
            Remaining: {formatIDR(remaining)}
          </div>
        </div>

        {inv && isPaid ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
            Invoice sudah <span className="font-semibold">PAID</span>.
          </div>
        ) : (
          <form
            onSubmit={onCreatePayment}
            className="rounded-2xl border border-white/10 bg-black/10 p-4 space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-white/80">
                Amount
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-white/20"
                inputMode="numeric"
                placeholder="500000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80">
                Paid At
              </label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-white/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80">
                Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-white/20"
              >
                <option value="TRANSFER" className="bg-[#0b1220] text-white">
                  TRANSFER
                </option>
                <option value="CASH" className="bg-[#0b1220] text-white">
                  CASH
                </option>
                <option value="EWALLET" className="bg-[#0b1220] text-white">
                  EWALLET
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2  w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                placeholder="Catatan (opsional)"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-black/80 border border-white/10 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create Payment"}
            </button>
          </form>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/20 text-white/70">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 font-semibold">Paid At</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Method</th>
                  <th className="px-5 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {(inv?.payments ?? []).length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-white/70" colSpan={4}>
                      Belum ada payment.
                    </td>
                  </tr>
                ) : (
                  (inv?.payments ?? []).map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-white/5 last:border-b-0"
                    >
                      <td className="px-5 py-4 text-white/80">
                        {fmtDate(p.paidAt ?? null)}
                      </td>
                      <td className="px-5 py-4 text-white">
                        {formatIDR(p.amount)}
                      </td>
                      <td className="px-5 py-4 text-white/80">
                        {p.method ?? "-"}
                      </td>
                      <td className="px-5 py-4 text-white/70">
                        {p.notes ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
