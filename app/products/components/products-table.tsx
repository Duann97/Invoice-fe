"use client";

import Link from "next/link";
import type { Product } from "./products-types";

function toNumber(v: any) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function formatIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProductsTable({
  products,
  loading,
  onSoftDelete,
}: {
  products: Product[];
  loading: boolean;
  onSoftDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr className="border-b">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3">Status</th>
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
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-600">
                  Belum ada product. Klik <b>Create Product</b>.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    {p.description ? (
                      <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                        {p.description}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-3">
                    <span className="text-gray-800">
                      {p.category?.name || "-"}
                    </span>
                  </td>

                  <td className="px-4 py-3">{p.unit || "-"}</td>

                  <td className="px-4 py-3 text-right font-semibold">
                    {formatIDR(toNumber(p.unitPrice))}
                  </td>

                  <td className="px-4 py-3">
                    <StatusPill deletedAt={p.deletedAt} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className={`rounded-lg border px-3 py-1.5 hover:bg-gray-50 ${
                          p.deletedAt ? "pointer-events-none opacity-50" : ""
                        }`}
                        title={p.deletedAt ? "Deleted product can't be edited" : "Edit"}
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => onSoftDelete(p.id)}
                        className={`rounded-lg border px-3 py-1.5 hover:bg-gray-50 ${
                          p.deletedAt ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={!!p.deletedAt}
                        title={p.deletedAt ? "Already deleted" : "Soft delete"}
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
        <div className="mt-2 h-3 w-64 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
      </td>
      <td className="px-4 py-3">
        <div className="ml-auto h-8 w-28 animate-pulse rounded bg-gray-100" />
      </td>
    </tr>
  );
}
