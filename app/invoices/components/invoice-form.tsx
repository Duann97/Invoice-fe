"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "@/lib/api";

import {
  createInvoiceSchema,
  updateInvoiceSchema,
  type InvoiceFormValues,
} from "../schema";

type Client = { id: string; name: string; email?: string | null };
type Product = {
  id: string;
  name: string;
  unitPrice: number | string;
  description?: string | null;
};

type Props =
  | {
      mode: "create";
      token: string;
      clients: Client[];
      products: Product[];
      loadingLists: boolean;
    }
  | {
      mode: "edit";
      invoiceId: string;
      token: string;
      clients: Client[];
      products: Product[];
      loadingLists: boolean;
    };

const safeTrim = (v?: string | null) => (v ?? "").trim();
const toNumber = (v: any) => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
};

// ✅ options
const CURRENCY_OPTIONS = [
  "IDR",
  "USD",
  "EUR",
  "SGD",
  "JPY",
  "AUD",
  "GBP",
] as const;

const PAYMENT_TERMS_OPTIONS = [
  { value: "", label: "— Pilih metode —" },
  { value: "TRANSFER_BCA", label: "Transfer BCA" },
  { value: "TRANSFER_BRI", label: "Transfer BRI" },
  { value: "TRANSFER_BNI", label: "Transfer BNI" },
 
  { value: "GOPAY", label: "GoPay" },
  { value: "OVO", label: "OVO" },
  { value: "DANA", label: "DANA" },
  
  { value: "OTHER", label: "Other" },
];

export default function InvoiceForm(props: Props) {
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const schema =
    props.mode === "create" ? createInvoiceSchema : updateInvoiceSchema;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(schema as any) as unknown as Resolver<InvoiceFormValues>,
    defaultValues: {
      clientId: "",
      invoiceNumber: "",
      issueDate: "",
      dueDate: "",
      paymentTerms: "",
      currency: "IDR",
      taxAmount: 0,
      discountAmount: 0,
      notes: "",
      items: [
        {
          itemName: "Item",
          description: "",
          quantity: 1,
          unitPrice: 0,
          productId: "",
        },
      ],
    },
    mode: "onSubmit",
  });

  // ===== fetch invoice detail for edit =====
  useEffect(() => {
    if (props.mode !== "edit") return;

    const run = async () => {
      try {
        setLoadingInvoice(true);
        setServerError(null);

        const res = await api.get(`/invoices/${props.invoiceId}`, {
          headers: { Authorization: `Bearer ${props.token}` },
        });

        const inv = res.data;
        const data = inv?.data ?? inv;

        form.reset({
          clientId: data?.clientId ?? "",
          invoiceNumber: data?.invoiceNumber ?? "",
          issueDate: data?.issueDate ? String(data.issueDate).slice(0, 10) : "",
          dueDate: data?.dueDate ? String(data.dueDate).slice(0, 10) : "",
          paymentTerms: data?.paymentTerms ?? "",
          currency: data?.currency ?? "IDR",
          taxAmount: data?.taxAmount ? toNumber(data.taxAmount) : 0,
          discountAmount: data?.discountAmount ? toNumber(data.discountAmount) : 0,
          notes: data?.notes ?? "",
          items: (data?.items ?? []).map((it: any) => ({
            itemName: it?.itemName ?? "Item",
            description: it?.description ?? "",
            quantity: toNumber(it?.quantity ?? 1),
            unitPrice: toNumber(it?.unitPrice ?? 0),
            productId: it?.productId ?? "",
          })),
        });
      } catch (e: any) {
        setServerError(
          e?.response?.data?.message || e?.message || "Gagal load invoice"
        );
      } finally {
        setLoadingInvoice(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode, (props as any).invoiceId, props.token]);

  const onSubmit: SubmitHandler<InvoiceFormValues> = async (values) => {
    try {
      setServerError(null);
      setServerMsg(null);

      const payload = {
        ...values,
        clientId: values.clientId,
        currency: safeTrim(values.currency) || "IDR",
        invoiceNumber: safeTrim(values.invoiceNumber) || undefined,
        paymentTerms: safeTrim(values.paymentTerms) || undefined,
        notes: safeTrim(values.notes) || undefined,
        taxAmount: toNumber(values.taxAmount ?? 0),
        discountAmount: toNumber(values.discountAmount ?? 0),
        items: (values.items ?? []).map((it: any) => ({
          itemName: safeTrim(it.itemName) || "Item",
          description: safeTrim(it.description) || undefined,
          quantity: toNumber(it.quantity ?? 1),
          unitPrice: toNumber(it.unitPrice ?? 0),
          productId: safeTrim(it.productId) ? safeTrim(it.productId) : undefined,
        })),
      };

      if (props.mode === "create") {
        const res = await api.post("/invoices", payload, {
          headers: { Authorization: `Bearer ${props.token}` },
        });
        setServerMsg(res.data?.message || "Invoice created");
        router.push("/invoices");
        return;
      }

      const res = await api.patch(`/invoices/${props.invoiceId}`, payload, {
        headers: { Authorization: `Bearer ${props.token}` },
      });
      setServerMsg(res.data?.message || "Invoice updated");
      router.push(`/invoices/${props.invoiceId}`);
    } catch (e: any) {
      setServerError(e?.response?.data?.message || e?.message || "Gagal submit");
    }
  };

  const items = form.watch("items") ?? [];

  const productsMap = useMemo(() => {
    const m = new Map<string, Product>();
    (props.products ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [props.products]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {props.loadingLists ? (
        <div className="rounded-xl border bg-gray-50 px-4 py-3 text-sm text-black-700">
          Loading clients & products...
        </div>
      ) : null}

      {loadingInvoice ? (
        <div className="rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-700">
          Loading invoice...
        </div>
      ) : null}

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

      <div className="rounded-2xl border bg-white p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Client</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-900"
            {...form.register("clientId")}
            disabled={props.loadingLists}
          >
            <option value="" style={{ color: "#111", backgroundColor: "#fff" }}>
              Pilih client
            </option>
            {(props.clients ?? []).map((c) => (
              <option
                key={c.id}
                value={c.id}
                style={{ color: "#111", backgroundColor: "#fff" }}
              >
                {c.name}
                {c.email ? ` (${c.email})` : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-red-600">
            {form.formState.errors.clientId?.message as any}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Invoice Number</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              {...form.register("invoiceNumber")}
            />
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.invoiceNumber?.message as any}
            </p>
          </div>

          {/* ✅ Currency dropdown */}
          <div>
            <label className="text-sm font-medium">Currency</label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-white text-gray-900"
              {...form.register("currency")}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c} style={{ color: "#111", backgroundColor: "#fff" }}>
                  {c}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.currency?.message as any}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Issue Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              {...form.register("issueDate")}
            />
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.issueDate?.message as any}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Due Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              {...form.register("dueDate")}
            />
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.dueDate?.message as any}
            </p>
          </div>

          {/* ✅ Payment Terms dropdown */}
          <div>
            <label className="text-sm font-medium">Payment Terms</label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 bg-white text-gray-900"
              {...form.register("paymentTerms")}
            >
              {PAYMENT_TERMS_OPTIONS.map((o) => (
                <option
                  key={o.value || o.label}
                  value={o.value}
                  style={{ color: "#111", backgroundColor: "#fff" }}
                >
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Tax</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                {...form.register("taxAmount", { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Discount</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border px-3 py-2"
                {...form.register("discountAmount", { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={3}
            {...form.register("notes")}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Items</h3>
          <button
            type="button"
            className="rounded-xl border px-3 py-2 text-sm"
            onClick={() =>
              form.setValue("items", [
                ...items,
                {
                  itemName: "Item",
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  productId: "",
                },
              ])
            }
          >
            + Add Item
          </button>
        </div>

        {items.map((_, idx) => {
          const productId = form.watch(`items.${idx}.productId` as const) ?? "";
          const selectedProduct = productId ? productsMap.get(productId) : null;

          return (
            <div key={idx} className="rounded-xl border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Item Name</label>
                  <input
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    {...form.register(`items.${idx}.itemName` as const)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Product (optional)</label>
                  <select
                    className="mt-1 w-full rounded-xl border px-3 py-2 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-900"
                    {...form.register(`items.${idx}.productId` as const)}
                    disabled={props.loadingLists}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      form.setValue(`items.${idx}.productId` as const, nextId);

                      if (!nextId) return;

                      const p = productsMap.get(nextId);
                      if (!p) return;

                      form.setValue(`items.${idx}.itemName` as const, p.name);
                      form.setValue(`items.${idx}.description` as const, p.description ?? "");
                      form.setValue(`items.${idx}.unitPrice` as const, toNumber(p.unitPrice));
                    }}
                  >
                    <option value="" style={{ color: "#111", backgroundColor: "#fff" }}>
                      Manual (tanpa product)
                    </option>
                    {(props.products ?? []).map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        style={{ color: "#111", backgroundColor: "#fff" }}
                      >
                        {p.name}
                      </option>
                    ))}
                  </select>

                  {selectedProduct ? (
                    <p className="mt-1 text-xs text-gray-600">
                      Auto: {selectedProduct.name} • Rp{" "}
                      {toNumber(selectedProduct.unitPrice).toLocaleString("id-ID")}
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <input
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    {...form.register(`items.${idx}.description` as const)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Qty</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    {...form.register(`items.${idx}.quantity` as const, { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit Price</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border px-3 py-2"
                    {...form.register(`items.${idx}.unitPrice` as const, { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-xl border px-3 py-2 text-sm text-red-600"
                  onClick={() => {
                    const next = [...items];
                    next.splice(idx, 1);
                    form.setValue("items", next);
                  }}
                  disabled={items.length <= 1}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        <p className="text-xs text-red-600">{(form.formState.errors.items as any)?.message}</p>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="rounded-xl border px-4 py-2" onClick={() => router.back()}>
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
          disabled={form.formState.isSubmitting}
        >
          {props.mode === "create" ? "Create Invoice" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
