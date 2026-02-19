"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";

type Category = {
  id: string;
  name: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function useQueryState() {
  const sp = useSearchParams();
  const router = useRouter();

  const q = sp.get("q") ?? "";
  const includeDeleted = sp.get("includeDeleted") === "true";

  const setParams = (next: { q?: string; includeDeleted?: boolean }) => {
    const params = new URLSearchParams(sp.toString());

    if (next.q !== undefined) {
      if (next.q.trim().length === 0) params.delete("q");
      else params.set("q", next.q);
    }

    if (next.includeDeleted !== undefined) {
      if (next.includeDeleted) params.set("includeDeleted", "true");
      else params.delete("includeDeleted");
    }

    const qs = params.toString();
    router.replace(qs ? `/categories?${qs}` : "/categories");
  };

  return { q, includeDeleted, setParams };
}

export default function CategoriesClientPage() {
  const router = useRouter();
  const { q, includeDeleted, setParams } = useQueryState();

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [data, setData] = useState<Category[]>([]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((c) => c.name.toLowerCase().includes(needle));
  }, [data, q]);

  const fetchCategories = async () => {
    setErrMsg(null);
    setLoading(true);
    try {
      const res = await api.get<Category[]>("/categories", {
        params: includeDeleted ? { includeDeleted: true } : {},
      });
      setData(res.data);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Gagal load categories.";
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
    fetchCategories();
    
  }, [includeDeleted]);

  const onSoftDelete = async (id: string) => {
    const ok = confirm("Soft delete category ini? (bisa dilihat via includeDeleted)");
    if (!ok) return;

    try {
      await api.delete(`/categories/${id}`);
      await fetchCategories();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal delete.");
    }
  };

  const onRename = async (id: string, currentName: string) => {
    const name = prompt("Rename category:", currentName);
    if (!name || name.trim().length === 0) return;

    try {
      await api.patch(`/categories/${id}`, { name: name.trim() });
      await fetchCategories();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal update.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
         
        </div>

        <Link
          href="/categories/create"
          className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Create Category
        </Link>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-2 sm:max-w-lg">
          <input
            value={q}
            onChange={(e) => setParams({ q: e.target.value })}
            placeholder="Search category name..."
            className="w-full rounded-xl border px-4 py-2 text-sm"
          />
          <button
            onClick={() => setParams({ q: "" })}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            title="Reset search"
          >
            Reset
          </button>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setParams({ includeDeleted: e.target.checked })}
          />
          Include deleted
        </label>
      </div>

      {errMsg && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errMsg}
        </div>
      )}

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr className="border-b">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-600" colSpan={4}>
                    Belum ada category. Klik <b>Create Category</b>.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <StatusPill deletedAt={c.deletedAt} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                     
  {new Date(c.updatedAt).toLocaleDateString("id-ID")}
</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                          onClick={() => onRename(c.id, c.name)}
                          disabled={!!c.deletedAt}
                          title={c.deletedAt ? "Deleted category can't be edited" : "Edit"}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                          onClick={() => onSoftDelete(c.id)}
                          disabled={!!c.deletedAt}
                          title={c.deletedAt ? "Already deleted" : "Soft delete"}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ deletedAt }: { deletedAt: string | null }) {
  if (deletedAt) {
    return (
      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        DELETED
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
      ACTIVE
    </span>
  );
}

function RowSkeleton() {
  return (
    <tr className="border-b">
      <td className="px-4 py-3">
        <div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-52 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="ml-auto h-8 w-32 animate-pulse rounded bg-gray-100" />
      </td>
    </tr>
  );
}
