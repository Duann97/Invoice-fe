"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type ProductRow = {
  id: string;
  name: string;
  description?: string | null;
  unit?: string | null;
  unitPrice?: number | string | null;
  category?: { id: string; name: string } | null;
  categoryId?: string | null;

  isDeleted?: boolean;
  deletedAt?: string | null;
};

type Category = { id: string; name: string };

function toNumber(v: any) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function normalizeList<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw?.items)) return raw.items as T[];
  if (Array.isArray(raw?.data)) return raw.data as T[];
  if (Array.isArray(raw?.data?.data)) return raw.data.data as T[];
  return [];
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => getToken(), []);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ ONLY ADD: meta state for pagination
  const [meta, setMeta] = useState<any>(null);

  const qs = useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    if (!sp.get("limit")) sp.set("limit", "10");
    if (!sp.get("page")) sp.set("page", "1");
    if (!sp.get("includeDeleted")) sp.set("includeDeleted", "false");
    return sp;
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setErr(null);
      setLoading(true);

      if (!token) {
        router.replace("/login");
        return;
      }

      const [pRes, cRes] = await Promise.all([
        api.get(`/products?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/categories?page=1&limit=200`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const list = normalizeList<ProductRow>(pRes.data);
      setRows(list);

      // ✅ ONLY ADD: normalize meta from response
      const m =
        pRes.data?.meta ??
        pRes.data?.data?.meta ??
        pRes.data?.data?.data?.meta ??
        null;
      setMeta(m);

      const cats = normalizeList<Category>(cRes.data);
      setCategories(cats);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message || e?.message || "Gagal load products";
      setErr(msg);

      if (status === 401) {
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
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, qs.toString()]);

  // ✅ IMPORTANT: refetch kalau user balik ke tab / balik dari halaman edit (browser back)
  useEffect(() => {
    const onFocus = () => {
      // jangan ganggu kalau lagi loading awal
      fetchData();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchData();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs.toString(), token]);

  const onChangeQuery = (patch: (sp: URLSearchParams) => void) => {
    const sp = new URLSearchParams(qs.toString());
    patch(sp);
    router.push(`/products?${sp.toString()}`);
  };

  const onDelete = async (id: string) => {
    try {
      if (!token) return;
      await api.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Gagal delete product");
    }
  };

  // ✅ ONLY ADD: page helpers
  const currentPage = Number(qs.get("page") || 1);
  const totalPages = meta?.totalPages ?? 1;
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products / Services</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/products/create"
            className="rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            + Create Product
          </Link>
          <Link
            href="/categories"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/90"
          >
            Manage Categories
          </Link>
        </div>
      </div>

      {err ? (
        <div className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {err}
        </div>
      ) : null}

      <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="grid gap-4 md:grid-cols-3 md:items-end">
          <div>
            <label className="text-sm font-medium text-white/80">Search</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white placeholder:text-white/40"
              placeholder="Cari nama product..."
              value={qs.get("q") || ""}
              onChange={(e) =>
                onChangeQuery((sp) => {
                  const v = e.target.value;
                  if (v) sp.set("q", v);
                  else sp.delete("q");
                  sp.set("page", "1");
                })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Category</label>
            <select
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white"
              value={qs.get("categoryId") || ""}
              onChange={(e) =>
                onChangeQuery((sp) => {
                  const v = e.target.value;
                  if (v) sp.set("categoryId", v);
                  else sp.delete("categoryId");
                  sp.set("page", "1");
                })
              }
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={qs.get("includeDeleted") === "true"}
              onChange={(e) =>
                onChangeQuery((sp) => {
                  sp.set("includeDeleted", e.target.checked ? "true" : "false");
                  sp.set("page", "1");
                })
              }
            />
            Include deleted
          </label>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-black/20">
        {loading ? (
          <div className="p-6 text-sm text-white/70">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-white/70">Belum ada product.</div>
        ) : (
          <table className="w-full text-sm text-white/90">
            <thead className="text-left text-white/60">
              <tr className="border-b border-white/10">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-white/10 last:border-b-0"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold">{p.name}</div>
                    {p.description ? (
                      <div className="mt-1 text-xs text-white/60">
                        {p.description}
                      </div>
                    ) : null}
                  </td>

                  <td className="py-3 px-4">{p.category?.name || "-"}</td>

                  <td className="py-3 px-4 text-center">{p.unit || "pcs"}</td>

                  <td className="py-3 px-4 text-right">
                    Rp {toNumber(p.unitPrice).toLocaleString("id-ID")}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/90"
                      >
                        Edit
                      </Link>
                      <button
                        className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/90"
                        onClick={() => onDelete(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ✅ ONLY ADD: pagination footer */}
        {meta ? (
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/70">
            <div>
              Page {meta.page ?? currentPage} / {meta.totalPages ?? "-"} • Total{" "}
              {meta.total ?? "-"}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/90 disabled:opacity-50"
                disabled={!canPrev}
                onClick={() =>
                  onChangeQuery((sp) => sp.set("page", String(currentPage - 1)))
                }
              >
                Prev
              </button>
              <button
                className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/90 disabled:opacity-50"
                disabled={!canNext}
                onClick={() =>
                  onChangeQuery((sp) => sp.set("page", String(currentPage + 1)))
                }
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}