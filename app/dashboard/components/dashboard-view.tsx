"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { ArrowRight, LogOut, Plus, RefreshCw, Repeat } from "lucide-react";

import KpiCard from "./kpi-card";
import StatusChart from "./status-chart";
import InvoicesTable from "./invoices-table";
import PaymentsTable from "./payments-table";
import EmptyState from "./empty-state";

type DashboardKpis = {
  totalOutstanding: number | string;
  totalPaidThisMonth: number | string;
  invoicesThisMonth: number;
  overdueCount: number;
};

type DashboardInvoice = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  total: number | string;
  client?: { id: string; name: string } | null;
};

type DashboardPayment = {
  id: string;
  paidAt: string;
  amount: number | string;
  method?: string | null;
  invoice?: { id: string; invoiceNumber: string } | null;
};

type DashboardResponse = {
  kpis: DashboardKpis;
  recentInvoices: DashboardInvoice[];
  recentPayments: DashboardPayment[];
  dueSoonInvoices: DashboardInvoice[];
};

function toNumber(v: number | string | undefined | null) {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const money = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function DashboardView() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get<DashboardResponse>("/dashboard/summary", {
        params: { limit: 5, dueSoonDays: 7, monthOffset: 0 },
      });
      setData(res.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gagal load dashboard.";
      setErrorMsg(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = data?.kpis;

  const statusCounts = useMemo(() => {
    const invoices = data?.recentInvoices ?? [];
    const map: Record<string, number> = {
      DRAFT: 0,
      SENT: 0,
      PENDING: 0,
      PAID: 0,
      OVERDUE: 0,
      CANCELLED: 0,
    };
    for (const inv of invoices) map[inv.status] = (map[inv.status] ?? 0) + 1;
    return map;
  }, [data]);

  const isEmpty =
    !loading &&
    !errorMsg &&
    (data?.recentInvoices?.length ?? 0) === 0 &&
    (data?.dueSoonInvoices?.length ?? 0) === 0 &&
    (data?.recentPayments?.length ?? 0) === 0;

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* top bar */}
      <div className="border-b bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-gray-600">
              Ringkasan invoice kamu hari ini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            
            <Link
              href="/recurring"
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Repeat className="h-4 w-4" />
              Recurring
            </Link>

            
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Outstanding"
            value={money(toNumber(kpis?.totalOutstanding))}
            subtitle="Total belum dibayar"
            loading={loading}
          />
          <KpiCard
            title="Paid (This Month)"
            value={money(toNumber(kpis?.totalPaidThisMonth))}
            subtitle="Pembayaran bulan ini"
            loading={loading}
          />
          <KpiCard
            title="Invoices (This Month)"
            value={String(kpis?.invoicesThisMonth ?? 0)}
            subtitle="Jumlah invoice bulan ini"
            loading={loading}
          />
          <KpiCard
            title="Overdue"
            value={String(kpis?.overdueCount ?? 0)}
            subtitle="Invoice lewat jatuh tempo"
            loading={loading}
          />
        </div>

        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Invoice Status (Recent)</h2>
                    <p className="text-sm text-gray-600">
                      Distribusi status dari invoice terbaru.
                    </p>
                  </div>

                  <Link
                    href="#"
                    className="inline-flex items-center gap-1 text-sm font-medium text-black"
                  >
                    View invoices <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-4">
                  <StatusChart statusCounts={statusCounts} loading={loading} />
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <h2 className="font-semibold">Due Soon</h2>
                <p className="text-sm text-gray-600">
                  Invoice yang jatuh tempo dalam 7 hari.
                </p>

                <div className="mt-4">
                  <InvoicesTable
                    compact
                    loading={loading}
                    invoices={data?.dueSoonInvoices ?? []}
                  />
                </div>
              </div>
            </div>

            {/* tables */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Recent Invoices</h2>
                    <p className="text-sm text-gray-600">
                      Invoice terakhir yang kamu buat / update.
                    </p>
                  </div>
                  <Link
                    href="#"
                    className="inline-flex items-center gap-1 text-sm font-medium text-black"
                  >
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-4">
                  <InvoicesTable
                    loading={loading}
                    invoices={data?.recentInvoices ?? []}
                  />
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <h2 className="font-semibold">Recent Payments</h2>
                <p className="text-sm text-gray-600">
                  Pembayaran terakhir yang tercatat.
                </p>

                <div className="mt-4">
                  <PaymentsTable
                    loading={loading}
                    payments={data?.recentPayments ?? []}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
