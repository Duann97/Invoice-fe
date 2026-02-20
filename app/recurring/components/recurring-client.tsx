"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getRecurring, type RecurringItem } from "@/lib/recurring";
import RecurringTable from "./recurring-table";

function normalizeRecurring(data: any): { items: RecurringItem[]; meta?: any } {
  // backend kamu: { message, items, meta }
  if (Array.isArray(data)) return { items: data };
  if (data?.items && Array.isArray(data.items))
    return { items: data.items, meta: data.meta };
  if (data?.data?.items && Array.isArray(data.data.items))
    return { items: data.data.items, meta: data.data.meta };
  // fallback
  return { items: [] };
}

export default function RecurringPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ ONLY ADD: URL-driven active/page/limit (pattern invoice)
  const activeParam = (searchParams?.get("active") || "all") as
    | "all"
    | "true"
    | "false";
  const page = Number(searchParams?.get("page") || 1);
  const limit = Number(searchParams?.get("limit") || 20);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [rules, setRules] = useState<RecurringItem[]>([]);
  const [meta, setMeta] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params =
        activeParam === "all"
          ? { page, limit }
          : { active: activeParam, page, limit };

      const data = await getRecurring(params as any);
      const normalized = normalizeRecurring(data);
      setRules(normalized.items ?? []);
      setMeta(normalized.meta ?? null);
    } catch (e: any) {
      setRules([]);
      setMeta(null);
      setError(
        e?.response?.data?.message || e?.message || "Failed to load recurring"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParam, page, limit]);

  const count = useMemo(() => rules.length, [rules]);

  // ✅ ONLY ADD: helpers
  const totalPages = meta?.totalPages ?? 1;
  const canPrev = (meta?.page ?? page) > 1;
  const canNext = (meta?.page ?? page) < totalPages;

  const setParam = (key: string, value?: string) => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    if (!value) sp.delete(key);
    else sp.set(key, value);
    sp.set("page", "1"); // reset when filter changes
    if (!sp.get("limit")) sp.set("limit", String(limit));
    router.push(`/recurring?${sp.toString()}`);
  };

  const goPage = (nextPage: number) => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    sp.set("page", String(nextPage));
    if (!sp.get("limit")) sp.set("limit", String(limit));
    router.push(`/recurring?${sp.toString()}`);
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Recurring Invoices</h1>
          </div>

          <Link
            href="/recurring/create"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Create Recurring
          </Link>
        </div>

        {/* Filter */}
        <div className="rounded-2xl border bg-white p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-gray-600">Active</label>
              <select
                value={activeParam}
                onChange={(e) => setParam("active", e.target.value)}
                className="rounded-md border px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <button
              onClick={() => router.push("/recurring")}
              className="mt-4 md:mt-5 rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Reset
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{count}</span> rule(s)
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Table */}
        {loading ? (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
            Loading...
          </div>
        ) : (
          <>
            <RecurringTable rules={rules ?? []} meta={meta} />

            {/* ✅ ONLY ADD: pagination bar */}
            {meta ? (
              <div className="mt-4 flex items-center justify-between rounded-2xl border bg-white px-4 py-3 text-xs text-gray-600">
                <div>
                  Page {meta.page ?? page} / {meta.totalPages ?? "-"} • Total{" "}
                  {meta.total ?? "-"}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    disabled={!canPrev}
                    onClick={() => goPage((meta.page ?? page) - 1)}
                  >
                    Prev
                  </button>
                  <button
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    disabled={!canNext}
                    onClick={() => goPage((meta.page ?? page) + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}