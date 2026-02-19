"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import InvoiceForm from "../../components/invoice-form";

type Client = { id: string; name: string; email?: string | null };
type Product = {
  id: string;
  name: string;
  unitPrice: number | string;
  description?: string | null;
};

function pickParamId(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Find first array that looks like list of {id, name} or {id, ...}
 * Works for many shapes:
 * - { message, data: [] }
 * - { message, data: { data: [] , meta } }
 * - { message, data: { items: [] } }
 * - { message, ...{data: [], meta} } etc
 */
function findArrayDeep(input: any): any[] {
  const seen = new Set<any>();

  const looksLikeList = (arr: any[]) => {
    if (!Array.isArray(arr)) return false;
    if (arr.length === 0) return false;
    const first = arr[0];
    return (
      first &&
      typeof first === "object" &&
      ("id" in first) &&
      // for clients/products we usually have name
      (("name" in first) || ("unitPrice" in first) || ("email" in first))
    );
  };

  const walk = (node: any): any[] | null => {
    if (!node || typeof node !== "object") return null;
    if (seen.has(node)) return null;
    seen.add(node);

    if (Array.isArray(node)) {
      if (looksLikeList(node)) return node;
      // sometimes list is empty but still at correct path
      // we don't accept empty here, keep searching other keys
      return null;
    }

    // common keys first (fast path)
    const priorityKeys = ["data", "items", "clients", "products", "result", "rows"];
    for (const k of priorityKeys) {
      if (k in node) {
        const hit = walk((node as any)[k]);
        if (hit) return hit;
        const v = (node as any)[k];
        if (Array.isArray(v) && v.length === 0) {
          // accept empty array if key is a common list container
          return v;
        }
      }
    }

    // then scan all keys
    for (const k of Object.keys(node)) {
      const v = (node as any)[k];
      if (Array.isArray(v)) {
        if (looksLikeList(v)) return v;
        if (v.length === 0) continue;
      } else if (v && typeof v === "object") {
        const hit = walk(v);
        if (hit) return hit;
      }
    }

    return null;
  };

  // try from input directly
  const found = walk(input);
  if (found) return found;

  // fallback: check common places explicitly
  const candidates = [
    input?.data,
    input?.data?.data,
    input?.result,
    input?.result?.data,
    input?.items,
    input?.clients,
    input?.products,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (Array.isArray(c?.data)) return c.data;
  }

  return [];
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = pickParamId(params?.id as any);

  const tokenFromStorage = useMemo(() => getToken(), []);
  const [token, setToken] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenFromStorage) {
      router.replace("/login");
      return;
    }
    setToken(tokenFromStorage);
  }, [router, tokenFromStorage]);

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      try {
        setErr(null);
        setLoadingLists(true);

        // ✅ pakai querystring (paling kompatibel)
        const [cRes, pRes] = await Promise.all([
          api.get(`/clients?page=1&limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`/products?page=1&limit=50&includeDeleted=false`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const cList = findArrayDeep(cRes?.data) as Client[];
        const pList = findArrayDeep(pRes?.data) as Product[];

        setClients(Array.isArray(cList) ? cList : []);
        setProducts(Array.isArray(pList) ? pList : []);
      } catch (e: any) {
        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message ?? e?.message ?? "Gagal memuat data";
        setErr(msg);

        if (status === 401) {
          clearToken();
          router.replace("/login");
        }
      } finally {
        setLoadingLists(false);
      }
    };

    run();
  }, [token, router]);

  // ✅ force InvoiceForm remount kalau list berubah (biar select options kebaca)
  const formKey = useMemo(() => {
    return `invoice-form-${invoiceId}-${clients.length}-${products.length}-${loadingLists ? "loading" : "ready"}`;
  }, [invoiceId, clients.length, products.length, loadingLists]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Edit Invoice</h1>
          <p className="mt-1 text-sm text-white/60">
            Update header/items invoice kamu.
          </p>

          <div className="mt-3 text-sm">
            <Link
              href={invoiceId ? `/invoices/${invoiceId}` : "/invoices"}
              className="underline text-white/70 hover:text-white"
            >
              Back to Detail
            </Link>
          </div>
        </div>

        {err ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-6 text-sm text-rose-200">
            {err}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <InvoiceForm
              key={formKey}
              mode="edit"
              invoiceId={invoiceId}
              token={token!}
              clients={clients}
              products={products}
              loadingLists={loadingLists}
            />
          </div>
        )}

        {/* debug kecil kalau ternyata list masih 0 */}
        {!loadingLists && !err && clients.length === 0 ? (
          <div className="mt-4 text-xs text-white/60">
            Catatan: list client masih kosong. Kalau kamu yakin ada client di DB,
            berarti response API /clients kamu beda banget (atau endpoint-nya bukan /clients).
          </div>
        ) : null}
      </div>
    </div>
  );
}
