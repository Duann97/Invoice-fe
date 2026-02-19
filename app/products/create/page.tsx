"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type Category = {
  id: string;
  name: string;
};

function normalizeList<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw?.items)) return raw.items as T[];
  if (Array.isArray(raw?.data)) return raw.data as T[];
  return [];
}

export default function CreateProductPage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCat, setLoadingCat] = useState(true);

  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    const run = async () => {
      try {
        setErr(null);
        setLoadingCat(true);

        // ✅ sesuaikan endpoint category di project kamu jika beda
        const res = await api.get("/categories?page=1&limit=200&includeDeleted=false", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCategories(normalizeList<Category>(res.data));
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ?? e?.message ?? "Gagal memuat categories";
        setErr(msg);

        if (e?.response?.status === 401) {
          clearToken();
          router.replace("/login");
        }
      } finally {
        setLoadingCat(false);
      }
    };

    run();
  }, [token, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErr(null);
      setMsg(null);
      setSubmitting(true);

      if (!name.trim()) {
        setErr("Nama wajib diisi");
        return;
      }

      const payload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        unitPrice: unitPrice === "" ? 0 : Number(unitPrice),
        unit: unit.trim() || undefined,
        categoryId: categoryId || undefined,
      };

      // ✅ sesuaikan endpoint product di project kamu jika beda
      await api.post("/products", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMsg("Product berhasil dibuat");
      router.push("/products");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Gagal create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-white">Create Product / Service</h1>
          
          <div className="mt-3 text-sm">
            <Link href="/products" className="text-white/70 hover:text-white underline">
              Back to Products
            </Link>
          </div>
        </div>

        {err ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        {msg ? (
          <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            {msg}
          </div>
        ) : null}

        <div className="mt-4 rounded-[36px] border border-white/10 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.04)] p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-white/90">Nama</label>
              <input
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20"
                value={name}
                onChange={(e) => setName(e.target.value)}
                
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white/90">
                Deskripsi (opsional)
              </label>
              <textarea
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Pembuatan website company profile"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-white/90">Harga</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20"
                  value={unitPrice}
                  onChange={(e) =>
                    setUnitPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="500000"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white/90">
                  Unit (opsional)
                </label>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-white/20"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="pcs / jam / bulan"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/90">Category</label>

              {/* ✅ FIX: dropdown tidak putih lagi + option gelap */}
              <select
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-white/20 disabled:opacity-60"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCat}
              >
                <option value="" className="bg-[#0B1220] text-white">
                  — Pilih category —
                </option>

                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0B1220] text-white">
                    {c.name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-white/50">
                {loadingCat ? "Loading categories..." : "Optional. Bisa dikosongkan."}
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Product"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
