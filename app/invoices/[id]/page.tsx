// app/invoices/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import Modal from "../../components/ui/modal";

type InvoiceItem = {
  id?: string;
  itemName?: string | null;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
  productId?: string | null;
  product?: { id: string; name?: string | null } | null;
};

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
  items?: InvoiceItem[];
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

const formatIDR = (v: any) => toNum(v).toLocaleString("id-ID");

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
  const [cancelling, setCancelling] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [inv, setInv] = useState<InvoiceDetail | null>(null);

  const [amount, setAmount] = useState<string>("");
  const [paidAt, setPaidAt] = useState<string>("");
  const [method, setMethod] = useState<string>("TRANSFER");
  const [notes, setNotes] = useState<string>("");

  const [openCancelModal, setOpenCancelModal] = useState(false);

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
  }, [id]);

  const status = String(inv?.status ?? "").toUpperCase();

  const isPaid = status === "PAID";
  const isOverdue = status === "OVERDUE";
  const isSent = status === "SENT";
  const isCancelled = status === "CANCELLED";
  const isDraft = status === "DRAFT";

  const canSend = !(isSent || isPaid || isOverdue || isCancelled);
  const canCreatePayment = isDraft || isSent;
  const canCancel = isDraft || isSent;

  // ✅ Edit hanya boleh kalau bukan PAID & bukan CANCELLED
  const canEdit = !(isPaid || isCancelled);

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
    if (!canSend) return;

    try {
      setSending(true);
      const res = await api.post(`/invoices/${id}/send`);
      setInfo(res?.data?.message ?? "Invoice berhasil dikirim.");
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

  const onAskCancel = () => {
    if (!canCancel) return;
    setOpenCancelModal(true);
  };

  const onConfirmCancel = async () => {
    setErr(null);
    setInfo(null);

    if (!token) {
      router.replace("/login");
      return;
    }
    if (!id) return;
    if (!canCancel) return;

    try {
      setCancelling(true);
      const res = await api.patch(`/invoices/${id}/cancel`);
      setInfo(res?.data?.message ?? "Invoice cancelled.");
      setOpenCancelModal(false);
      await fetchDetail();
    } catch (e: any) {
      const statusCode = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal cancel invoice.";
      setErr(msg);
      if (statusCode === 401) handle401();
    } finally {
      setCancelling(false);
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

    if (!canCreatePayment) {
      setErr("Payment hanya bisa dibuat untuk invoice DRAFT atau SENT.");
      return;
    }

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
      <Modal
        open={openCancelModal}
        onClose={() => (cancelling ? null : setOpenCancelModal(false))}
        title="Cancel Invoice"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/80">
            Yakin mau cancel invoice ini? Setelah cancelled, invoice tidak bisa
            dikirim lagi.
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setOpenCancelModal(false)}
              disabled={cancelling}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60 disabled:cursor-default"
            >
              Batal
            </button>

            <button
              onClick={onConfirmCancel}
              disabled={cancelling}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-default"
            >
              {cancelling ? "Cancelling..." : "Ya, Cancel"}
            </button>
          </div>
        </div>
      </Modal>

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
            disabled={sending || !canSend}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60 disabled:cursor-default"
            title={
              !canSend
                ? "Invoice sudah SENT/PAID/OVERDUE/CANCELLED"
                : "Send invoice"
            }
          >
            {sending ? "Sending..." : "Send"}
          </button>

          <button
            onClick={onAskCancel}
            disabled={cancelling || !canCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60 disabled:cursor-default"
            title={
              canCancel
                ? "Cancel invoice"
                : "Cancel hanya untuk DRAFT atau SENT (PAID/OVERDUE/CANCELLED tidak bisa)"
            }
          >
            {cancelling ? "Cancelling..." : "Cancel"}
          </button>

          {/* ✅ Edit disabled dibuat “nyala dikit” pas hover sama kayak Send/Cancel */}
          {canEdit ? (
            <Link
              href={`/invoices/${id}/edit`}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 border border-white/10"
            >
              Edit
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60 disabled:cursor-default"
              title="Invoice PAID / CANCELLED tidak bisa diedit"
            >
              Edit
            </button>
          )}
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
          <div className="space-y-5">
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
                Client:{" "}
                <span className="text-white">{inv.client?.name ?? "-"}</span>
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
                Due Date:{" "}
                <span className="text-white">{fmtDate(inv.dueDate)}</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="mb-3 text-sm font-semibold text-white/90">
                Items / Products
              </div>

              {(() => {
                const items: any[] = (inv as any).items || [];
                if (!Array.isArray(items) || items.length === 0) {
                  return (
                    <div className="text-sm text-white/60">Tidak ada item.</div>
                  );
                }

                const getItemName = (it: any) =>
                  it?.itemName ??
                  it?.name ??
                  it?.productName ??
                  it?.serviceName ??
                  it?.product?.name ??
                  "-";

                const getQty = (it: any) => it?.qty ?? it?.quantity ?? it?.amount ?? 0;

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-white/80">
                      <thead className="text-left text-white/60">
                        <tr className="border-b border-white/10">
                          <th className="py-2">Item</th>
                          <th className="py-2 text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => (
                          <tr
                            key={it?.id ?? idx}
                            className="border-b border-white/10 last:border-b-0"
                          >
                            <td className="py-2">
                              <span className="text-white">
                                {String(getItemName(it))}
                              </span>
                            </td>
                            <td className="py-2 text-right">
                              <span className="text-white">{Number(getQty(it)) || 0}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Payments</h2>
          <div className="mt-1 text-sm text-white/70">
            Total paid: {formatIDR(totalPaid)} / Invoice total:{" "}
            {formatIDR(invoiceTotal)}
            <br />
            Remaining: {formatIDR(remaining)}
          </div>
        </div>

        {!inv ? null : canCreatePayment ? (
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
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                placeholder="Catatan (opsional)"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-black/80 border border-white/10 disabled:opacity-60 disabled:cursor-default"
            >
              {creating ? "Creating..." : "Create Payment"}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
            
          </div>
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
                    <tr key={p.id} className="border-b border-white/5 last:border-b-0">
                      <td className="px-5 py-4 text-white/80">{fmtDate(p.paidAt ?? null)}</td>
                      <td className="px-5 py-4 text-white">{formatIDR(p.amount)}</td>
                      <td className="px-5 py-4 text-white/80">{p.method ?? "-"}</td>
                      <td className="px-5 py-4 text-white/70">{p.notes ?? "-"}</td>
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
