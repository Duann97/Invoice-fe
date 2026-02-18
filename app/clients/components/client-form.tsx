"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/clients";
import { useToast } from "../../components/ui/toast-provider"

export default function ClientForm() {
  const router = useRouter(); 
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim() || undefined,
      phone: String(formData.get("phone") || "").trim() || undefined,
      address: String(formData.get("address") || "").trim() || undefined,
      paymentPreference:
        String(formData.get("paymentPreference") || "").trim() || undefined,
      notes: String(formData.get("notes") || "").trim() || undefined,
    };

    try {
      await createClient(payload);
      showToast("Client berhasil dibuat", "success");
      router.replace("/clients");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Gagal membuat client";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border bg-white p-6 space-y-4"
    >
      <div>
        <label className="text-sm font-medium">Nama Client</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="PT Maju Jaya"
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="finance@majujaya.com"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Phone</label>
          <input
            name="phone"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="081234567890"
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Address</label>
        <textarea
          name="address"
          className="mt-1 w-full rounded-md border px-3 py-2 min-h-[90px]"
          placeholder="Jakarta"
          autoComplete="off"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Payment Preference</label>
        <input
          name="paymentPreference"
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="Transfer BCA"
          autoComplete="off"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Notes</label>
        <textarea
          name="notes"
          className="mt-1 w-full rounded-md border px-3 py-2 min-h-[90px]"
          placeholder="PIC: Rina"
          autoComplete="off"
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          disabled={loading}
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:opacity-90"
        >
          {loading ? "Saving..." : "Save Client"}
        </button>
      </div>
    </form>
  );
}
