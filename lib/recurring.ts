import { api } from "./api";

export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type RecurringItem = {
  id: string;
  userId: string;
  clientId: string;
  templateInvoiceId?: string | null;
  frequency: RecurringFrequency;
  interval: number;
  startAt: string;
  endAt?: string | null;
  nextRunAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  client?: { id: string; name: string; email?: string | null };
  templateInvoice?: { id: string; invoiceNumber?: string | null };
};

export type RecurringListResponse =
  | { items: RecurringItem[]; meta?: any; message?: string }
  | { data: { items: RecurringItem[]; meta?: any } }
  | RecurringItem[];

export const getRecurring = async (params?: { active?: "true" | "false"; page?: number; limit?: number }) => {
  const res = await api.get<RecurringListResponse>("/recurring", { params });
  return res.data;
};

export const createRecurring = async (payload: any) => {
  const res = await api.post("/recurring", payload);
  return res.data;
};

export const updateRecurring = async (id: string, payload: any) => {
  const res = await api.patch(`/recurring/${id}`, payload);
  return res.data;
};

export const runRecurring = async (id?: string) => {
  const res = await api.post("/recurring/run", id ? { id } : {});
  return res.data;
};
