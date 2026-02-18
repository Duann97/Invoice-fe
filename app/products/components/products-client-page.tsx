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

export default function ProductsClientPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const q = sp.get("q") ?? "";
  const categoryId = sp.get("categoryId") ?? "";
  const includeDeleted = parseBool(sp.get("includeDeleted"));

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const setParams = (next: {
    q?: string;
    categoryId?: string;
    includeDeleted?: boolean;
  }) => {
    const params = new URLSearchParams(sp.toString());

    if (next.q !== undefined) {
      const val = next.q.trim();
      if (!val) params.delete("q");
      else params.set("q", val);
    }

    if (next.categoryId !== undefined) {
      if (!next.categoryId) params.delete("categoryId");
      else params.set("categoryId", next.categoryId);
    }

    if (next.includeDeleted !== undefined) {
      if (next.includeDeleted) params.set("includeDeleted", "true");
      else params.delete("includeDeleted");
    }

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

      const res = await api.get<Product[]>("/products", { params });
      setProducts(res.data);
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
  }, [q, categoryId, includeDeleted]);

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
