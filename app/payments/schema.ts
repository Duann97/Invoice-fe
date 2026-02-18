import { z } from "zod";

/**
 * Type untuk list/detail payments (dipakai UI)
 * Pastikan sesuai response backend kamu.
 */
export type Payment = {
  id: string;
  invoiceId: string;
  userId: string;
  amount: string; // backend prisma Decimal biasanya balik string
  paidAt: string; // ISO string
  method?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const paymentMethodEnum = z.enum(["TRANSFER", "CASH", "EWALLET", "OTHER"]);

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, "invoiceId wajib diisi"),
  // ✅ coerce -> output number, tidak jadi unknown
  amount: z.coerce.number().min(1, "amount minimal 1").finite("amount tidak valid"),
  paidAt: z
    .string()
    .min(1, "paidAt wajib diisi")
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "Format paidAt harus YYYY-MM-DD"),
  method: paymentMethodEnum.optional(),
  notes: z.string().optional(),
});

export type CreatePaymentValues = z.infer<typeof createPaymentSchema>;
