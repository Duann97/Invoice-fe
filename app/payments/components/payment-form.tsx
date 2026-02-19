"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

import { createPaymentSchema, type CreatePaymentValues } from "../schema";
import { useToast } from "../../components/ui/toast-provider";

type Props = {
  invoiceId: string;
  maxAmount?: number; // optional guard (sisa tagihan)
  onCreated?: () => void;
};

export default function PaymentForm({ invoiceId, maxAmount, onCreated }: Props) {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);
  const { showToast } = useToast();

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMsg, setServerMsg] = useState<string | null>(null);

  const form = useForm<CreatePaymentValues>({
    // ✅ CAST biar ga merah di beberapa versi RHF/resolvers
    resolver: zodResolver(createPaymentSchema) as unknown as Resolver<CreatePaymentValues>,
    defaultValues: {
      invoiceId,
      amount: 0,
      paidAt: new Date().toISOString().slice(0, 10),
      method: "TRANSFER",
      notes: "",
    },
    mode: "onSubmit",
  });

  const onSubmit: SubmitHandler<CreatePaymentValues> = async (values) => {
    try {
      setServerError(null);
      setServerMsg(null);

      // ✅ FE guard: jangan boleh bayar melebihi sisa tagihan
      if (maxAmount !== undefined && Number.isFinite(maxAmount)) {
        const amt = Number(values.amount ?? 0);
        if (amt > maxAmount) {
          const msg = `Amount melebihi sisa tagihan. Maksimal: ${Number(maxAmount).toLocaleString(
            "id-ID"
          )}`;
          setServerError(msg);
          showToast(msg, "error");
          form.setError("amount", { type: "manual", message: msg });
          return;
        }
      }

      if (!token) {
        clearToken();
        router.replace("/login");
        return;
      }

      await api.post(
        "/payments",
        {
          invoiceId: values.invoiceId,
          amount: values.amount, // number
          paidAt: values.paidAt, // YYYY-MM-DD
          method: values.method ?? "TRANSFER",
          notes: values.notes?.trim() ? values.notes.trim() : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const okMsg = "Payment berhasil dibuat.";
      setServerMsg(okMsg);
      showToast(okMsg, "success");

      onCreated?.();

      form.reset({
        invoiceId,
        amount: 0,
        paidAt: new Date().toISOString().slice(0, 10),
        method: "TRANSFER",
        notes: "",
      });
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Gagal membuat payment";
      setServerError(msg);
      showToast(msg, "error");

      if (status === 401) {
        clearToken();
        router.replace("/login");
      }
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      {serverError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      ) : null}

      {serverMsg ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {serverMsg}
        </div>
      ) : null}

      {/* hidden invoiceId */}
      <input type="hidden" {...form.register("invoiceId")} />

      {/* Amount */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Amount</label>
        <input
          type="number"
          className="w-full rounded-xl border px-3 py-2"
          
          max={maxAmount !== undefined ? maxAmount : undefined}
          // ✅ pastiin input jadi number di RHF
          {...form.register("amount", { valueAsNumber: true })}
        />
        {form.formState.errors.amount?.message ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.amount.message}
          </p>
        ) : null}
      </div>

      {/* Paid At */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Paid At</label>
        <input
          type="date"
          className="w-full rounded-xl border px-3 py-2"
          {...form.register("paidAt")}
        />
        {form.formState.errors.paidAt?.message ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.paidAt.message}
          </p>
        ) : null}
      </div>

      {/* Method */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Method</label>
        <select
          className="w-full rounded-xl border px-3 py-2"
          {...form.register("method")}
        >
          <option value="TRANSFER">TRANSFER</option>
          <option value="CASH">CASH</option>
          <option value="EWALLET">EWALLET</option>
          <option value="OTHER">OTHER</option>
        </select>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Notes</label>
        <textarea
          className="w-full rounded-xl border px-3 py-2"
          rows={3}
          placeholder="Catatan (opsional)"
          {...form.register("notes")}
        />
      </div>

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {form.formState.isSubmitting ? "Saving..." : "Create Payment"}
      </button>
    </form>
  );
}
