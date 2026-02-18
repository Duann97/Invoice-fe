"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import InvoicePayments from "../components/invoice-payments";
import { useToast } from "../../components/ui/toast-provider";

type InvoiceDetail = any;

export default function InvoiceDetailClient({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);
  const { showToast } = useToast();

  const [data, setData] = useState<InvoiceDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchInvoice = async () => {
    try {
      setErr(null);
      setLoading(true);

      const t = token ?? "";
      if (!t) {
        router.replace("/login");
        return;
      }

      const res = await api.get(`/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${t}` },
      });

      setData(res.data?.data ?? res.data);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal load invoice";
      setErr(msg);

      if (status === 401) {
        clearToken();
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSendInvoice = async () => {
    try {
      setErr(null);
      setSending(true);

      const t = token ?? "";
      if (!t) {
        router.replace("/login");
        return;
      }

      // ✅ sesuai BE kamu: POST /invoices/:id/send
      const res = await api.post(
        `/invoices/${invoiceId}/send`,
        {},
        { headers: { Authorization: `Bearer ${t}` } }
      );

      const updated = res.data?.data ?? res.data;
      if (updated) setData(updated);

      showToast("Invoice berhasil dikirim ke email client. Status menjadi SENT.", "success");

      await fetchInvoice();
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal kirim invoice";
      setErr(msg);
      showToast(msg, "error");

      if (status === 401) {
        clearToken();
        router.replace("/login");
      }
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Invoice Detail</h1>
          <p className="mt-1 text-sm text-gray-600">
            Lihat invoice dan record payment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/invoices" className="rounded-xl border px-4 py-2">
            Back
          </Link>

          <button
            type="button"
            className="rounded-xl border px-4 py-2"
            onClick={onSendInvoice}
            disabled={sending || loading}
          >
            {sending ? "Sending..." : "Send Invoice"}
          </button>

          <Link
            href={`/invoices/${invoiceId}/edit`}
            className="rounded-xl bg-black px-4 py-2 text-white"
          >
            Edit
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-700">
          Loading...
        </div>
      ) : err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {err}
        </div>
      ) : !data ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-700">
          No data
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-white p-6 space-y-2">
            <div className="text-sm text-gray-700">
              <div>
                <span className="font-medium">Invoice Number:</span>{" "}
                {data.invoiceNumber}
              </div>
              <div>
                <span className="font-medium">Status:</span> {data.status}
              </div>
              <div>
                <span className="font-medium">Client:</span>{" "}
                {data.client?.name ?? data.clientId}
              </div>
              <div>
                <span className="font-medium">Client Email:</span>{" "}
                {data.client?.email ?? "-"}
              </div>
              <div>
                <span className="font-medium">Total:</span> {String(data.total)}
              </div>
            </div>
          </div>

          <InvoicePayments invoiceId={invoiceId} invoiceTotal={data.total} />
        </>
      )}
    </div>
  );
}
