"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const id = params?.id;
  const initialName = searchParams.get("name") ?? "";

  const token = useMemo(() => getToken(), []);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const authHeader = () => ({
    Authorization: `Bearer ${token}`,
  });

  const handle401 = () => {
    clearToken();
    router.replace("/login");
  };

  const onSave = async () => {
    setErr(null);

    if (!token) {
      router.replace("/login");
      return;
    }
    if (!id) {
      setErr("Category ID tidak ditemukan.");
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      setErr("Nama category wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      await api.patch(
        `/categories/${id}`,
        { name: trimmed },
        { headers: authHeader() }
      );

      router.push("/categories");
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal update category.";
      setErr(msg);
      if (status === 401) handle401();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Edit Category</h1>
          <p className="mt-1 text-sm text-white/65">
            Ubah nama category tanpa popup browser.
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

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80">
            Category Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
            placeholder="Category name..."
          />
        </div>

        <button
          onClick={onSave}
          disabled={saving}
          className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
