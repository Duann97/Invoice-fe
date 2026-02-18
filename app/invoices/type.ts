export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PENDING"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type Category = { id: string; name: string };

export type Product = {
  id: string;
  name: string;
  unitPrice: string | number; // backend decimal bisa kebaca string
  unit?: string | null;
  category?: Category | null;
};

export type InvoiceItem = {
  id?: string;
  itemName: string;
  description?: string | null;
  quantity: string | number;
  unitPrice: string | number;
  lineTotal?: string | number;
  productId?: string | null;
};

export type Invoice = {
  id: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paymentTerms?: string | null;
  currency: string;
  status: InvoiceStatus;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  notes?: string | null;

  client?: Client;
  items?: InvoiceItem[];
};
