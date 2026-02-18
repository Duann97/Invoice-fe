"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  paymentPreference?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type InvoiceRow = {
  id: string;
  invoiceNumber?: string | null;
  status?: string | null;
  total?: string | number | null;
  issueDate?: string | null;
  dueDate?: string | null;
};

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const token = useMemo(() => getToken(), []);

  const clientId = params?.id;

  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!clientId) return;

    const run = async () => {
      try {
        setErr(null);
        setLoading(true);

        const headers = { Authorization: `Bearer ${token}` };

        
        const [cRes, invRes] = await Promise.all([
          api.get(`/clients/${clientId}`, { headers }),
          api.get(`/invoices`, {
            headers,
            params: { page: 1, limit: 50, clientId },
          }),
        ]);

        setClient(cRes.data);

        
        const data = invRes.data?.data ?? [];
        setInvoices(Array.isArray(data) ? data : []);
      } catch (e: any) {
        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message || e?.message || "Gagal load client detail";
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
  }, [token, router, clientId]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Client Detail</h1>
          <p className="mt-1 text-sm text-gray-600">
            Lihat informasi client dan invoice yang dimiliki client ini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/clients"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back
          </Link>

          
          <Link
            href={`/invoices/create?clientId=${clientId}`}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Create Invoice
          </Link>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
          Loading...
        </div>
      ) : !client ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
          Client not found.
        </div>
      ) : (
        <>
          {/* Client Info */}
          <div className="rounded-2xl border bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{client.name}</h2>
                <p className="text-sm text-gray-600">
                  Updated{" "}
                  {new Date(client.updatedAt).toLocaleDateString("id-ID")}
                </p>
              </div>

              <div className="text-right text-sm text-gray-700">
                <div>{client.email || "-"}</div>
                <div>{client.phone || "-"}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="text-sm">
                <div className="font-medium">Address</div>
                <div className="text-gray-600">{client.address || "-"}</div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Payment Preference</div>
                <div className="text-gray-600">
                  {client.paymentPreference || "-"}
                </div>
              </div>
              <div className="text-sm md:col-span-2">
                <div className="font-medium">Notes</div>
                <div className="text-gray-600 whitespace-pre-wrap">
                  {client.notes || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invoices</h2>
              <Link
                href={`/invoices?clientId=${clientId}`}
                className="text-sm underline text-gray-700"
              >
                View all invoices
              </Link>
            </div>

            <div className="mt-4">
              {invoices.length === 0 ? (
                <div className="text-sm text-gray-600">
                  Client ini belum punya invoice.{" "}
                  <Link
                    href={`/invoices/create?clientId=${clientId}`}
                    className="underline"
                  >
                    Buat invoice pertama
                  </Link>
                  .
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-600">
                      <tr className="border-b">
                        <th className="py-2">No</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Issue</th>
                        <th className="py-2">Due</th>
                        <th className="py-2 text-right">Total</th>
                        <th className="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b last:border-b-0">
                          <td className="py-2 font-medium">
                            {inv.invoiceNumber || "-"}
                          </td>
                          <td className="py-2">{inv.status || "-"}</td>
                          <td className="py-2">
                            {inv.issueDate
                              ? new Date(inv.issueDate).toLocaleDateString(
                                  "id-ID"
                                )
                              : "-"}
                          </td>
                          <td className="py-2">
                            {inv.dueDate
                              ? new Date(inv.dueDate).toLocaleDateString(
                                  "id-ID"
                                )
                              : "-"}
                          </td>
                          <td className="py-2 text-right">
                            {String(inv.total ?? "-")}
                          </td>
                          <td className="py-2 text-right">
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                            >
                              Detail
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
