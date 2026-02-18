"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import InvoiceForm from "../components/invoice-form";

type Client = { id: string; name: string; email?: string | null };
type Product = {
  id: string;
  name: string;
  unitPrice: number | string;
  description?: string | null;
};

// helper biar tahan berbagai bentuk response
function normalizeList<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw?.items)) return raw.items as T[];
  if (Array.isArray(raw?.data)) return raw.data as T[];
  return [];
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace("/login");
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      try {
        setErr(null);
        setLoadingLists(true);

        const [cRes, pRes] = await Promise.all([
          api.get("/clients?page=1&limit=100", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/products?page=1&limit=100&includeDeleted=false", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const cList = normalizeList<Client>(cRes.data);
        const pList = normalizeList<Product>(pRes.data);

        setClients(cList);
        setProducts(pList);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ?? e?.message ?? "Gagal memuat data";
        setErr(msg);

        if (e?.response?.status === 401) {
          clearToken();
          router.replace("/login");
        }
      } finally {
        setLoadingLists(false);
      }
    };

    run();
  }, [token, router]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Create Invoice</h1>
          <p className="mt-1 text-sm text-gray-600">
            Buat invoice baru untuk client kamu.
          </p>
          <div className="mt-3 text-sm">
            <Link href="/invoices" className="underline text-gray-700">
              Back to Invoices
            </Link>
          </div>
        </div>

        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {err}
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-6">
            <InvoiceForm
              mode="create"
              token={token!}
              clients={clients}
              products={products}
              loadingLists={loadingLists}
            />
          </div>
        )}
      </div>
    </div>
  );
}
