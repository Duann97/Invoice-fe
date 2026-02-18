import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  unitPrice: z
    .number()
    .refine((v) => Number.isFinite(v), "Harga harus berupa angka")
    .min(0, "Harga harus >= 0"),
  unit: z.string().max(30).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
});

export type ProductSchema = z.infer<typeof productSchema>;
