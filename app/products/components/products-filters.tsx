"use client";

import type { Category } from "./products-types";

export default function ProductsFilters({
  q,
  categoryId,
  includeDeleted,
  categories,
  onChange,
}: {
  q: string;
  categoryId: string;
  includeDeleted: boolean;
  categories: Category[];
  onChange: (next: {
    q?: string;
    categoryId?: string;
    includeDeleted?: boolean;
  }) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="grid w-full gap-3 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Search</label>
            <input
              value={q}
              onChange={(e) => onChange({ q: e.target.value })}
              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
              placeholder="Cari nama product..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={categoryId}
              onChange={(e) => onChange({ categoryId: e.target.value })}
              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            
          </div>

          <div className="flex items-center gap-2 md:pb-2">
            <input
              id="includeDeleted"
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => onChange({ includeDeleted: e.target.checked })}
            />
            <label htmlFor="includeDeleted" className="text-sm text-gray-700">
              Include deleted
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
         
        </div>
      </div>
    </div>
  );
}
