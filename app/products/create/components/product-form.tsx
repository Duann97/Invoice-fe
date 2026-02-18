"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

import { productSchema, type ProductSchema } from "../../schema";

type Category = { id: string; name: string };

type ProductFormProps = {
  mode: "create" | "edit";
  productId?: string;
};

type ProductResponse = {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: number;
  unit?: string | null;
  categoryId?: string | null;
};

export default function ProductForm(props: ProductFormProps) {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);

  const [categories, setCategories] = useState<Category[]>([]);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const form = useForm<ProductSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      unitPrice: 0,
      unit: "",
      categoryId: "",
    },
    mode: "onSubmit",
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get<Category[]>("/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data || []);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        clearToken();
        router.replace("/login");
      }
    }
  };

  const fetchProductIfEdit = async () => {
    if (props.mode !== "edit" || !props.productId) return;

    setLoadingProduct(true);
    setServerError(null);

    try {
      const res = await api.get<ProductResponse>(`/products/${props.productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const p = res.data;
      form.reset({
        name: p.name ?? "",
        description: p.description ?? "",
        unitPrice: Number(p.unitPrice ?? 0),
        unit: p.unit ?? "",
        categoryId: p.categoryId ?? "",
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Gagal load product.";
      setServerError(msg);

      if (e?.response?.status === 401) {
        clearToken();
        router.replace("/login");
      }
    } finally {
      setLoadingProduct(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchCategories();
    fetchProductIfEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit: SubmitHandler<ProductSchema> = async (values) => {
    setServerMsg(null);
    setServerError(null);

    try {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        unitPrice: values.unitPrice,
        unit: values.unit || undefined,
        categoryId: values.categoryId || undefined,
      };

      if (props.mode === "edit") {
        if (!props.productId) throw new Error("productId is required for edit");
        await api.patch(`/products/${props.productId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setServerMsg("Product berhasil di-update.");
        return;
      }

      await api.post("/products", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setServerMsg("Product berhasil dibuat.");
      // sesuai style kamu sebelumnya: boleh tetap stay di page
      // kalau mau balik list: router.replace("/products");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Gagal submit.";
      setServerError(msg);

      if (e?.response?.status === 401) {
        clearToken();
        router.replace("/login");
      }
    }
  };

  const disabled = form.formState.isSubmitting || loadingProduct;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {loadingProduct ? (
        <div className="rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-700">
          Loading product...
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Nama</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Web Development"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Deskripsi (opsional)</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={3}
            placeholder="Pembuatan website company profile"
            {...form.register("description")}
          />
          {form.formState.errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Harga (IDR)</label>
          <input
            type="number"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="5000000"
            {...form.register("unitPrice", {
              valueAsNumber: true, // ✅ INI KUNCI FIX
            })}
          />
          {form.formState.errors.unitPrice && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.unitPrice.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Unit (opsional)</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="project / pcs / hour"
            {...form.register("unit")}
          />
          {form.formState.errors.unit && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.unit.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Category (opsional)</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            {...form.register("categoryId")}
          >
            <option value="">— Pilih category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {form.formState.errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.categoryId.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {form.formState.isSubmitting
          ? "Saving..."
          : props.mode === "edit"
          ? "Save Changes"
          : "Create Product"}
      </button>
    </form>
  );
}
