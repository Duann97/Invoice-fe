"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import Modal from "../components/ui/modal";

type Category = {
  id: string;
  name: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  updatedAt?: string;
};

function toISODate(d?: string) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID");
  } catch {
    return "-";
  }
}

function isDeletedRow(c: Category) {
  return !!c.isDeleted || !!c.deletedAt;
}

function normalize(s: string) {
  return (s ?? "").toString().trim().toLowerCase();
}

export default function CategoriesPage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // UI filters
  const [q, setQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // ensure Apply uses latest values
  const qRef = useRef("");
  const includeDeletedRef = useRef(false);

  const [rows, setRows] = useState<Category[]>([]);

  // delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

  const authHeader = () => ({
    Authorization: `Bearer ${token}`,
  });

  const handle401 = () => {
    clearToken();
    router.replace("/login");
  };

  const fetchCategories = async (opts?: { q?: string; includeDeleted?: boolean }) => {
    setErr(null);
    setInfo(null);
    setLoading(true);

    const queryQ = opts?.q ?? qRef.current ?? q;
    const incDel = opts?.includeDeleted ?? includeDeletedRef.current ?? includeDeleted;

    try {
      const res = await api.get("/categories", {
        headers: authHeader(),
        params: {
          // try multiple keys for compatibility
          q: queryQ || undefined,
          search: queryQ || undefined,
          name: queryQ || undefined,

          includeDeleted: incDel,
          include_deleted: incDel ? "true" : "false",
        },
      });

      const data = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(data) ? data : data.data ?? [];
      setRows(Array.isArray(list) ? list : []);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal load categories.";
      setErr(msg);
      if (status === 401) handle401();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    qRef.current = "";
    includeDeletedRef.current = false;

    fetchCategories({ q: "", includeDeleted: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onReset = () => {
    setErr(null);
    setInfo(null);

    setQ("");
    setIncludeDeleted(false);

    qRef.current = "";
    includeDeletedRef.current = false;

    fetchCategories({ q: "", includeDeleted: false });
  };

  const onApply = () => {
    setErr(null);
    setInfo(null);
    fetchCategories({ q: qRef.current, includeDeleted: includeDeletedRef.current });
  };

  const openDelete = (c: Category) => {
    setErr(null);
    setInfo(null);
    setDeleteId(c.id);
    setDeleteName(c.name ?? "");
    setDeleteOpen(true);
  };

  const submitDelete = async () => {
    setErr(null);
    setInfo(null);

    const id = deleteId;
    if (!id) return;

    try {
      const res = await api.delete(`/categories/${id}`, {
        headers: authHeader(),
      });

      setInfo(res.data?.message ?? "Category berhasil dihapus.");
      setDeleteOpen(false);
      setDeleteId(null);

      fetchCategories({ q: qRef.current, includeDeleted: includeDeletedRef.current });
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal delete category.";
      setErr(msg);
      if (status === 401) handle401();
    }
  };

  // FE fallback filtering (so UI always correct)
  const filteredRows = useMemo(() => {
    const qq = normalize(q);
    const incDel = includeDeleted;

    return rows.filter((c) => {
      const del = isDeletedRow(c);
      if (!incDel && del) return false;
      if (!qq) return true;
      return normalize(c.name).includes(qq);
    });
  }, [rows, q, includeDeleted]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Categories</h1>
          <p className="mt-1 text-sm text-white/65">
            Dipakai untuk grouping Product/Service (dan nanti invoice items).
          </p>
        </div>

        <button
          onClick={() => router.push("/categories/create")}
          className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 border border-white/10"
        >
          + Create Category
        </button>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      {info ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          {info}
        </div>
      ) : null}

      {/* filters */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div>
              <label className="block text-xs font-medium text-white/70">
                Search
              </label>
              <input
                value={q}
                onChange={(e) => {
                  const v = e.target.value;
                  setQ(v);
                  qRef.current = v;
                }}
                placeholder="Search category name..."
                className="mt-1 h-10 w-full  rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
              />
            </div>

            <label className="mt-2 md:mt-6 inline-flex items-center gap-2 text-sm text-white/75">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => {
                  const v = e.target.checked;
                  setIncludeDeleted(v);
                  includeDeletedRef.current = v;
                }}
                className="h-4 w-4 accent-white"
              />
              Include deleted
            </label>
          </div>

          <div className="flex gap-2">
            
           
          </div>
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          {/* ✅ FIX: 40% / 20% / 40% => kolom Updated bener-bener di tengah table */}
          <table className="min-w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[20%]" />
              <col className="w-[40%]" />
            </colgroup>

            <thead className="bg-black/20 text-white/70">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold text-center">Updated</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-white/70" colSpan={3}>
                    Loading...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-white/70" colSpan={3}>
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                filteredRows.map((c) => {
                  const deleted = isDeletedRow(c);

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-white/5 last:border-b-0"
                    >
                      <td className="px-5 py-4 text-white">
                        <div className="flex items-center gap-3">
                          <span className="truncate">{c.name}</span>
                          {deleted ? (
                            <span className="inline-flex shrink-0 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-[11px] font-semibold text-red-200">
                              DELETED
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center text-white/70">
                        {toISODate(c.updatedAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/categories/${c.id}/edit?name=${encodeURIComponent(
                                  c.name ?? ""
                                )}`
                              )
                            }
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => openDelete(c)}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE MODAL */}
      <Modal
        open={deleteOpen}
        title="Delete category?"
        description={`Category "${deleteName}" akan dihapus (soft delete).`}
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <button
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={submitDelete}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500/90"
            >
              Delete
            </button>
          </>
        }
      >
        <div className="text-sm text-white/70">
          Kamu masih bisa tampilkan category ini dengan opsi{" "}
          <span className="font-semibold">Include deleted</span>.
        </div>
      </Modal>
    </div>
  );
}
