"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type Category = { id: string; name: string };

type ProductLike = {
  id: string;
  name?: string;
  description?: string | null;
  price?: number | string | null;
  unit?: string | null;
  categoryId?: string | null;

  // optional flags (kalau BE kamu punya)
  type?: string; // "PRODUCT" | "SERVICE"
  isService?: boolean;
};

const toIdString = (v: unknown) => {
  if (!v) return "";
  if (Array.isArray(v)) return String(v[0] ?? "");
  return String(v);
};

const pickData = (res: any) => res?.data?.data ?? res?.data;

function extractAxiosUrl(e: any) {
  const baseURL = e?.config?.baseURL ?? "";
  const url = e?.config?.url ?? "";
  return `${baseURL}${url}`;
}

async function tryGet(paths: string[], headers: any) {
  let lastErr: any = null;

  for (const p of paths) {
    try {
      const res = await api.get(p, { headers });
      return res;
    } catch (e: any) {
      lastErr = e;
      const status = e?.response?.status;
      if (status === 404) continue;
      throw e;
    }
  }

  throw lastErr;
}

async function tryPatch(paths: string[], payload: any, headers: any) {
  let lastErr: any = null;

  for (const p of paths) {
    try {
      const res = await api.patch(p, payload, { headers });
      return res;
    } catch (e: any) {
      lastErr = e;
      const status = e?.response?.status;
      if (status === 404) continue;
      throw e;
    }
  }

  throw lastErr;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const token = useMemo(() => getToken(), []);
  const productId = useMemo(() => toIdString((params as any)?.id), [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);

  // form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [unit, setUnit] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  // to decide PATCH endpoint
  const [detectedType, setDetectedType] = useState<"PRODUCT" | "SERVICE" | null>(
    null
  );

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const handle401 = () => {
    clearToken();
    router.replace("/login");
  };

  const fetchCategories = async () => {
    const res = await api.get("/categories", {
      headers,
      params: { includeDeleted: "false" },
    });

    const data = pickData(res) ?? [];
    const rows = Array.isArray(data) ? data : data?.data ?? [];
    setCategories(
      rows
        .filter((c: any) => !c?.isDeleted && !c?.deletedAt)
        .map((c: any) => ({ id: c.id, name: c.name }))
    );
  };

  /**
   * ✅ FIX UTAMA:
   * Jangan bergantung pada /products/:id atau /services/:id untuk load,
   * karena backend kamu kemungkinan tidak punya endpoint detail tsb (atau beda),
   * tapi pasti punya LIST (karena products page bisa tampil).
   */
  const fetchFromListAndHydrate = async () => {
    if (!productId) return;

    // coba beberapa kemungkinan list endpoint
    const listCandidates = ["/products", "/services", "/items"];

    let listRes: any = null;
    let lastErr: any = null;

    for (const path of listCandidates) {
      try {
        // ambil banyak biar aman, karena kita cari by id
        const res = await api.get(path, {
          headers,
          params: { page: 1, limit: 200, includeDeleted: "true" },
        });
        const payload = pickData(res);
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : [];

        const found = rows.find((r: any) => String(r?.id) === String(productId));
        if (found) {
          const item: ProductLike = found;

          setName(item?.name ?? "");
          setDescription(item?.description ?? "");
          setPrice(
            item?.price === null || item?.price === undefined
              ? ""
              : String(item.price)
          );
          setUnit(item?.unit ?? "");
          setCategoryId(item?.categoryId ?? "");

          // detect type for PATCH
          const t =
            (item?.type || "").toUpperCase() ||
            (path === "/services" ? "SERVICE" : "PRODUCT");

          if (t === "SERVICE" || item?.isService) setDetectedType("SERVICE");
          else setDetectedType("PRODUCT");

          return; // ✅ sukses hydrate
        }

        // kalau list endpoint ini valid tapi id belum ketemu, lanjut coba endpoint lain
        listRes = res;
      } catch (e: any) {
        lastErr = e;
        const status = e?.response?.status;
        if (status === 401) throw e;
        // kalau 404 list endpoint gak ada, lanjut coba list lain
        continue;
      }
    }

    // Kalau sampai sini: list endpoint ada tapi item tidak ketemu
    if (listRes) {
      setDetectedType(null);
      throw new Error(
        `Item dengan id "${productId}" tidak ditemukan di list. (Cek apakah data sudah terhapus / userId berbeda)`
      );
    }

    // Kalau list endpoint pun tidak ada
    throw (
      lastErr ||
      new Error("Tidak menemukan endpoint list /products atau /services.")
    );
  };

  const init = async () => {
    setErr(null);
    setInfo(null);

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!productId) {
      setLoading(false);
      setErr("productId tidak ditemukan dari URL.");
      return;
    }

    try {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchFromListAndHydrate()]);
    } catch (e: any) {
      const status = e?.response?.status;
      const rawMsg = e?.response?.data?.message ?? e?.message ?? "Request error";
      const hitUrl = extractAxiosUrl(e);

      // Jangan “tutup-tutupi” msg backend
      const msg =
        status === 401
          ? rawMsg
          : hitUrl
          ? `${rawMsg} (Hit: ${hitUrl})`
          : rawMsg;

      setErr(msg);
      if (status === 401) handle401();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!productId) {
      setErr("productId is required for edit");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErr("Nama wajib diisi.");
      return;
    }

    const numericPrice =
      price.trim() === "" ? null : Number(String(price).replace(/[^\d.-]/g, ""));
    if (numericPrice !== null && !Number.isFinite(numericPrice)) {
      setErr("Harga harus berupa angka.");
      return;
    }

    const payload: any = {
      name: trimmedName,
      description: description?.trim() || null,
      price: numericPrice,
      unit: unit?.trim() || null,
      categoryId: categoryId || null,
    };

    try {
      setSaving(true);

      // ✅ pilih endpoint update berdasarkan detectedType
      const candidates =
        detectedType === "SERVICE"
          ? [`/services/${productId}`, `/products/${productId}`, `/items/${productId}`]
          : [`/products/${productId}`, `/services/${productId}`, `/items/${productId}`];

      const res = await tryPatch(candidates, payload, headers);

      setInfo(res.data?.message ?? "Berhasil diupdate.");
    } catch (e: any) {
      const status = e?.response?.status;
      const rawMsg = e?.response?.data?.message ?? e?.message ?? "Gagal update";
      const hitUrl = extractAxiosUrl(e);

      setErr(hitUrl ? `${rawMsg} (Hit: ${hitUrl})` : rawMsg);
      if (status === 401) handle401();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Edit Product</h1>
          <p className="mt-1 text-sm text-white/70">
            Update data product/jasa kamu.
          </p>
        </div>

        <Link
          href="/products"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Back
        </Link>
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

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        {loading ? (
          <div className="text-sm text-white/70">Loading...</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-white/80">
                Nama
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-white/20"
                placeholder="Nama product/jasa..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80">
                Deskripsi (opsional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2  w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                placeholder="Deskripsi..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/80">
                  Harga (IDR)
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-white/20"
                  
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80">
                  Unit (opsional)
                </label>
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-white/20"
                  placeholder="pcs, jam, paket..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80">
                Category (opsional)
              </label>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-white/20"
              >
                <option value="" className="bg-[#0b1220] text-white">
                  — Pilih category —
                </option>

                {categories.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    className="bg-[#0b1220] text-white"
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
