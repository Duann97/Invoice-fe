"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function CreateCategoryForm() {
  const [name, setName] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerMsg(null);

    if (name.trim().length === 0) {
      setServerError("Name wajib diisi");
      return;
    }

    setLoading(true);
    try {
      await api.post("/categories", { name: name.trim() });
      setServerMsg("Create category success ✅");
      setName("");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gagal create category.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
         
        />
      </div>

      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {serverMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {serverMsg}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          disabled={loading}
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create"}
        </button>

        <Link
          href="/categories"
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Back to Categories
        </Link>
      </div>
    </form>
  );
}
