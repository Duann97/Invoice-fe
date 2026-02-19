"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type DashboardSummary = {
  kpis: {
    totalOutstanding: number;
    totalPaidThisMonth: number;
    invoicesThisMonth: number;
    overdueCount: number;
  };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    total: string | number;
    dueDate: string;
    client?: { name?: string } | null;
  }>;
  recentPayments: Array<{
    id: string;
    amount: string | number;
    paidAt: string;
    invoice?: { invoiceNumber?: string } | null;
  }>;
  dueSoonInvoices: Array<{
    id: string;
    invoiceNumber: string;
    dueDate: string;
    total: string | number;
    client?: { name?: string } | null;
  }>;
};

function formatIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function toNumber(v: any) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function Badge({ status }: { status: string }) {
  const s = String(status || "").toUpperCase();

  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide";

  const cls =
    s === "PAID"
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
      : s === "SENT"
      ? "border-sky-300/20 bg-sky-400/10 text-sky-200"
      : s === "PENDING"
      ? "border-amber-300/20 bg-amber-400/10 text-amber-200"
      : s === "OVERDUE"
      ? "border-rose-300/20 bg-rose-400/10 text-rose-200"
      : s === "CANCELLED"
      ? "border-white/15 bg-white/[0.06] text-white/70"
      : "border-white/15 bg-white/[0.06] text-white/70";

  return <span className={`${base} ${cls}`}>{s || "DRAFT"}</span>;
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 backdrop-blur",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
        "transition",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const token = useMemo(() => getToken(), []);

  const fetchSummary = async () => {
    setErrMsg(null);
    setLoading(true);

    try {
      const res = await api.get("/dashboard/summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 5,
          dueSoonDays: 7,
          monthOffset: 0,
        },
      });

      // ✅ backend kamu return: { message, data: { kpis,... } }
      setData(res.data?.data ?? res.data);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Gagal load dashboard.";
      setErrMsg(msg);

      if (e?.response?.status === 401) {
        clearToken();
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = data?.kpis;

  const hasAny =
    !!data &&
    ((data.recentInvoices?.length ?? 0) > 0 ||
      (data.recentPayments?.length ?? 0) > 0 ||
      (data.dueSoonInvoices?.length ?? 0) > 0 ||
      toNumber(kpis?.invoicesThisMonth) > 0);

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        
        <section
          className={[
            "relative overflow-hidden rounded-[36px] border border-white/10 bg-[#070B14]",
            "h-[60vh] ",
          ].join(" ")}
        >
          
          <div className="pointer-events-none absolute inset-0">
            <Image
              src="/dashboard-hero.svg"
              alt="Dashboard hero"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* subtle overlays */}
          <div className="pointer-events-none absolute inset-0  from-black/55 via-black/25 to-black/10" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.22),transparent_55%)]" />

          {/* content spacer */}
          <div className="relative h-full px-8 py-10 md:px-12 md:py-14" />
        </section>

        {/* Error */}
        {errMsg && (
          <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-200">
            {errMsg}
          </div>
        )}

        
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <GlassCard className="p-5">
            <div className="text-xs text-white/60">Outstanding</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {formatIDR(toNumber(kpis?.totalOutstanding))}
            </div>
            
          </GlassCard>

          <GlassCard className="p-5">
            <div className="text-xs text-white/60">Paid</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {formatIDR(toNumber(kpis?.totalPaidThisMonth))}
            </div>
            
          </GlassCard>

          <GlassCard className="p-5">
            <div className="text-xs text-white/60">Invoices</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {toNumber(kpis?.invoicesThisMonth)}
            </div>
           
          </GlassCard>

          <GlassCard className="p-5">
            <div className="text-xs text-white/60">Overdue</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {toNumber(kpis?.overdueCount)}
            </div>
            
          </GlassCard>
        </div>

        {/* Lists */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Recent invoices */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-white/90">
                  Invoices terbaru
                </div>
                
              </div>
              
            </div>

            <div className="mt-4 space-y-3">
              {!data || (data.recentInvoices?.length ?? 0) === 0 ? (
                <div className="text-sm text-white/60">Belum ada invoice.</div>
              ) : (
                data.recentInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className={[
                      "block rounded-2xl border border-white/10 bg-black/20 p-3",
                      "transition",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/90">
                          {inv.invoiceNumber}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                          <span className="truncate">{inv.client?.name || "-"}</span>
                          <span className="text-white/30">•</span>
                          <Badge status={inv.status} />
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {formatIDR(toNumber(inv.total))}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </GlassCard>

          {/* Recent payments */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-white/90">
                  Payments terbaru
                </div>
                
              </div>
              
            </div>

            <div className="mt-4 space-y-3">
              {!data || (data.recentPayments?.length ?? 0) === 0 ? (
                <div className="text-sm text-white/60">Belum ada pembayaran.</div>
              ) : (
                data.recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className={[
                      "rounded-2xl border border-white/10 bg-black/20 p-3",
                      "transition",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/90">
                          {p.invoice?.invoiceNumber || "Payment"}
                        </div>
                        <div className="text-xs text-white/60">
                          {new Date(p.paidAt).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {formatIDR(toNumber(p.amount))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Due soon */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-white/90">
                  Jatuh tempo segera
                </div>
               
              </div>
              
             
            </div>

            <div className="mt-4 space-y-3">
              {!data || (data.dueSoonInvoices?.length ?? 0) === 0 ? (
                <div className="text-sm text-white/60">
                  Tidak ada invoice jatuh tempo dalam 7 hari.
                </div>
              ) : (
                data.dueSoonInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className={[
                      "block rounded-2xl border border-white/10 bg-black/20 p-3",
                      "transition",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/90">
                          {inv.invoiceNumber}
                        </div>
                        <div className="text-xs text-white/60">
                          {inv.client?.name || "-"} •{" "}
                          {new Date(inv.dueDate).toLocaleDateString("id-ID")}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {formatIDR(toNumber(inv.total))}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {!loading && !hasAny && !errMsg && (
          <GlassCard className="mt-6 p-6">
            <div className="text-sm text-white/70">
              Belum ada data untuk ditampilkan. Coba buat invoice pertama kamu.
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
