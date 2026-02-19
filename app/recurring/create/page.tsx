"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";

function normalizeList<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw?.items)) return raw.items as T[];
  if (Array.isArray(raw?.data)) return raw.data as T[];
  if (Array.isArray(raw?.data?.data)) return raw.data.data as T[];
  return [];
}

type Client = { id: string; name: string; email?: string | null };
type Invoice = {
  id: string;
  invoiceNumber?: string | null;
  clientId: string;
  status?: string;
};

export default function CreateRecurringPage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);

  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientId: "",
    templateInvoiceId: "",
    frequency: "MONTHLY",
    interval: 1,
    startAt: "",
    endAt: "",
    isActive: true,
  });

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    const run = async () => {
      try {
        setErr(null);
        setLoading(true);

        const headers = { Authorization: `Bearer ${token}` };

        // ✅ limit MAX 100 (sesuai backend)
        const [cRes, iRes] = await Promise.all([
          api.get("/clients?page=1&limit=100", { headers }),
          api.get("/invoices?page=1&limit=100", { headers }),
        ]);

        setClients(normalizeList<Client>(cRes.data));
        setInvoices(normalizeList<Invoice>(iRes.data));
      } catch (e: any) {
        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message || e?.message || "Failed to load data";
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
  }, [token, router]);

  // ✅ filter invoices berdasarkan client yang dipilih
  const filteredInvoices = useMemo(() => {
    if (!form.clientId) return [];
    return (invoices || [])
      .filter((inv) => inv.clientId === form.clientId)
      .sort((a, b) => {
        const aa = a.invoiceNumber ? 0 : 1;
        const bb = b.invoiceNumber ? 0 : 1;
        return aa - bb;
      });
  }, [invoices, form.clientId]);

  // reset template kalau ganti client
  useEffect(() => {
    setForm((prev) => ({ ...prev, templateInvoiceId: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.clientId]);

  const submit = async () => {
    if (!form.clientId) return alert("Client wajib dipilih");
    if (!form.templateInvoiceId) return alert("Template invoice wajib dipilih");
    if (!form.startAt) return alert("startAt wajib diisi");

    try {
      setErr(null);
      const headers = { Authorization: `Bearer ${token}` };

      const payload: any = {
        clientId: form.clientId,
        templateInvoiceId: form.templateInvoiceId,
        frequency: form.frequency,
        interval: Number(form.interval || 1),
        startAt: new Date(form.startAt).toISOString(),
        isActive: Boolean(form.isActive),
      };

      // ✅ NextRunAt dihilangkan dari UI (biar backend auto set = startAt)
      if (form.endAt) payload.endAt = new Date(form.endAt).toISOString();

      await api.post("/recurring", payload, { headers });

      router.push("/recurring");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to create recurring";
      setErr(msg);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Recurring</h1>
        <Link href="/recurring" className="rounded-lg border px-3 py-2 text-sm">
          Back
        </Link>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
          Loading clients & invoices...
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Client</label>
            <select
              className="mt-1 w-full rounded border p-2 text-sm"
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {clients.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Belum ada client. Buat dulu di menu Clients.
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Template Invoice</label>
            <select
              className="mt-1 w-full rounded border p-2 text-sm"
              value={form.templateInvoiceId}
              disabled={!form.clientId}
              onChange={(e) =>
                setForm({ ...form, templateInvoiceId: e.target.value })
              }
            >
              <option value="">
                {form.clientId
                  ? "Select Template Invoice"
                  : "Select client first"}
              </option>

              {filteredInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber ?? inv.id}
                  {inv.status ? ` • ${inv.status}` : ""}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-gray-500">
              Invoice yang tampil hanya invoice milik client yang dipilih.
            </p>

            {form.clientId && filteredInvoices.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Client ini belum punya invoice. Buat invoice dulu, lalu gunakan
                sebagai template.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Frequency</label>
              <select
                className="mt-1 w-full rounded border p-2 text-sm"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Interval</label>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded border p-2 text-sm"
                value={form.interval}
                onChange={(e) =>
                  setForm({ ...form, interval: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-sm font-medium">Start At</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded border p-2 text-sm"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              />
              
            </div>

            <div>
              <label className="text-sm font-medium">Stop Date (opsional)</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded border p-2 text-sm"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              />
              
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>

          <button
            onClick={submit}
            className="w-full rounded-xl bg-black py-2 text-sm text-white hover:opacity-90"
          >
            Create Recurring
          </button>
        </div>
      )}
    </div>
  );
}