"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";

import type { Category, Product } from "./products-types";
import ProductsFilters from "./products-filters";
import ProductsTable from "./products-table";

function parseBool(v: string | null) {
  if (!v) return false;
  return v === "true" || v === "1" || v === "yes";
}

function normalizeProducts(data: any): { items: Product[]; meta?: any } {
  if (Array.isArray(data)) return { items: data };
  if (Array.isArray(data?.items)) return { items: data.items, meta: data.meta };
  if (Array.isArray(data?.data?.items))
    return { items: data.data.items, meta: data.data.meta };
  return { items: [] };
}

export default function ProductsClientPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const q = sp.get("q") ?? "";
  const categoryId = sp.get("categoryId") ?? "";
  const includeDeleted = parseBool(sp.get("includeDeleted"));

  // ✅ ONLY ADD: page/limit from URL (pattern invoice)
  const page = Number(sp.get("page") || 1);
  const limit = Number(sp.get("limit") || 10);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const setParams = (next: {
    q?: string;
    categoryId?: string;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams(sp.toString());

    if (next.q !== undefined) {
      const val = next.q.trim();
      if (!val) params.delete("q");
      else params.set("q", val);
      // ✅ reset page when filter changes
      params.set("page", "1");
    }

    if (next.categoryId !== undefined) {
      if (!next.categoryId) params.delete("categoryId");
      else params.set("categoryId", next.categoryId);
      params.set("page", "1");
    }

    if (next.includeDeleted !== undefined) {
      if (next.includeDeleted) params.set("includeDeleted", "true");
      else params.delete("includeDeleted");
      params.set("page", "1");
    }

    if (next.page !== undefined) params.set("page", String(next.page));
    if (next.limit !== undefined) params.set("limit", String(next.limit));

    // ensure defaults exist
    if (!params.get("page")) params.set("page", "1");
    if (!params.get("limit")) params.set("limit", "10");

    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products");
  };

  const fetchCategories = async () => {
    const res = await api.get<Category[]>("/categories");
    setCategories(res.data);
  };

  const fetchProducts = async () => {
    setErrMsg(null);
    setLoading(true);
    try {
      const params: any = {};
      if (q.trim()) params.q = q.trim();
      if (categoryId) params.categoryId = categoryId;
      if (includeDeleted) params.includeDeleted = true;

      // ✅ ONLY ADD: pagination params
      params.page = page;
      params.limit = limit;

      const res = await api.get("/products", { params });
      const normalized = normalizeProducts(res.data);

      setProducts(normalized.items);
      setMeta(normalized.meta ?? null);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Gagal load products.";
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
    // categories hanya buat dropdown filter & create/edit
    fetchCategories().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryId, includeDeleted, page, limit]);

  const onRefresh = () => fetchProducts();

  const onSoftDelete = async (id: string) => {
    const ok = confirm("Soft delete product ini?");
    if (!ok) return;

    try {
      await api.delete(`/products/${id}`);
      await fetchProducts();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal delete.");
    }
  };

  const kpi = useMemo(() => {
    const active = products.filter((p) => !p.deletedAt).length;
    const deleted = products.filter((p) => !!p.deletedAt).length;
    return { active, deleted, total: products.length };
  }, [products]);

  const totalPages = meta?.totalPages ?? 1;
  const canPrev = (meta?.page ?? page) > 1;
  const canNext = (meta?.page ?? page) < totalPages;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products / Services</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/products/create"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            + Create Product
          </Link>

          <Link
            href="/categories"
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Manage Categories
          </Link>
        </div>
      </div>

      {/* KPI mini */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MiniCard label="Total" value={kpi.total} />
        <MiniCard label="Active" value={kpi.active} />
        <MiniCard label="Deleted" value={kpi.deleted} />
      </div>

      <div className="mt-6">
        <ProductsFilters
          q={q}
          categoryId={categoryId}
          includeDeleted={includeDeleted}
          categories={categories}
          onChange={setParams}
        />
      </div>

      {errMsg && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errMsg}
        </div>
      )}

      <div className="mt-6">
        <ProductsTable
          products={products}
          loading={loading}
          onSoftDelete={onSoftDelete}
        />
      </div>

      {/* ✅ ONLY ADD: pagination bar */}
      {meta ? (
        <div className="mt-4 flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-xs text-gray-600">
          <div>
            Page {meta.page ?? page} / {meta.totalPages ?? "-"} • Total{" "}
            {meta.total ?? "-"}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              disabled={!canPrev}
              onClick={() => setParams({ page: (meta?.page ?? page) - 1 })}
            >
              Prev
            </button>
            <button
              className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              disabled={!canNext}
              onClick={() => setParams({ page: (meta?.page ?? page) + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}