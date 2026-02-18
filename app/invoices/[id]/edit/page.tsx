"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import InvoiceForm from "../../components/invoice-form";

type Client = { id: string; name: string; email?: string | null };
type Product = { id: string; name: string; unitPrice: number | string; description?: string | null };

function pickParamId(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
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

        const [cRes, pRes] = await Promise.all([
          api.get("/clients?page=1&limit=100", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/products?page=1&limit=100&includeDeleted=false", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setClients(Array.isArray(cRes.data?.data) ? cRes.data.data : []);
        setProducts(Array.isArray(pRes.data?.data) ? pRes.data.data : []);
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message ?? "Gagal memuat data";
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
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Edit Invoice</h1>
          <p className="mt-1 text-sm text-gray-600">Update header/items invoice kamu.</p>
          <div className="mt-3 text-sm">
            <Link href={invoiceId ? `/invoices/${invoiceId}` : "/invoices"} className="underline text-gray-700">
              Back to Detail
            </Link>
          </div>
        </div>

        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{err}</div>
        ) : (
          <div className="rounded-2xl border bg-white p-6">
            <InvoiceForm
              mode="edit"
              invoiceId={invoiceId}
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
