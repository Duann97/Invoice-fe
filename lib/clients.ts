import { api } from "./api";

export type ClientPayload = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentPreference?: string;
  notes?: string;
};

export type ClientItem = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  paymentPreference?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientListResponse =
  | { items: ClientItem[]; meta?: any }
  | ClientItem[];

export const getClients = async (q?: string) => {
  const res = await api.get<ClientListResponse>("/clients", {
    params: q ? { q } : undefined,
  });
  return res.data;
};

export const createClient = async (payload: ClientPayload) => {
  const res = await api.post<ClientItem>("/clients", payload);
  return res.data;
};
