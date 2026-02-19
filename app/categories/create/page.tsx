"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

export default function CreateCategoryPage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const authHeader = () => ({
    Authorization: `Bearer ${token}`,
  });

  const handle401 = () => {
    clearToken();
    router.replace("/login");
  };

  const onSubmit = async () => {
    setErr(null);
    setInfo(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setErr("Nama category wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(
        "/categories",
        { name: trimmed },
        { headers: authHeader() }
      );

      setInfo(res.data?.message ?? "Category berhasil dibuat.");
      router.push("/categories");
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal create category.";
      setErr(msg);
      if (status === 401) handle401();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Create Category</h1>
          <p className="mt-1 text-sm text-white/65">
            Buat category untuk grouping Product/Service.
          </p>
        </div>

        <button
          onClick={() => router.push("/categories")}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Back
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

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80">
            Category Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
           
            className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-70"
        >
          {loading ? "Creating..." : "Create Category"}
        </button>
      </div>
    </div>
  );
}
