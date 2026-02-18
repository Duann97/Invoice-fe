// app/invoices/schema.ts
import { z } from "zod";

export const invoiceItemSchema = z.object({
  // buat FE: itemName kita sediain supaya edit invoice ga error (backend butuh itemName di Update)
  itemName: z.string().min(1, "Nama item wajib").max(120).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  quantity: z.coerce.number().min(1, "Qty minimal 1"),
  unitPrice: z.coerce.number().min(0, "Harga minimal 0"),
  productId: z.string().optional().or(z.literal("")),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client wajib dipilih"),
  invoiceNumber: z.string().optional().or(z.literal("")),
  issueDate: z.string().min(1, "Issue date wajib diisi"),
  dueDate: z.string().min(1, "Due date wajib diisi"),
  paymentTerms: z.string().optional().or(z.literal("")),
  currency: z.string().optional().or(z.literal("IDR")),
  taxAmount: z.coerce.number().min(0).optional().default(0),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "Minimal 1 item"),
});

export const updateInvoiceSchema = z.object({
  clientId: z.string().optional().or(z.literal("")),
  invoiceNumber: z.string().optional().or(z.literal("")),
  issueDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  paymentTerms: z.string().optional().or(z.literal("")),
  currency: z.string().optional().or(z.literal("")),
  taxAmount: z.coerce.number().min(0).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  notes: z.string().optional().or(z.literal("")),
  // items optional saat update (sesuai backend/service kamu)
  items: z.array(invoiceItemSchema).optional(),
});

export type CreateInvoiceSchema = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceSchema = z.infer<typeof updateInvoiceSchema>;

// kita pakai type ini di form supaya ga union error di resolver
export type InvoiceFormValues = CreateInvoiceSchema & Partial<UpdateInvoiceSchema>;
