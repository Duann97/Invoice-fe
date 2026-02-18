export type Category = {
  id: string;
  name: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: string | number;
  unit?: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
};
