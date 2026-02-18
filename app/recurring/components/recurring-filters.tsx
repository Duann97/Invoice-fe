"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function RecurringFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: string, value?: string) => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    if (!value) sp.delete(key);
    else sp.set(key, value);
    sp.set("page", "1");
    router.push(`/recurring?${sp.toString()}`);
  };

  return (
    <div className="flex gap-3 items-end">
      <div>
        <label className="text-sm">Active</label>
        <select
          className="block rounded border px-3 py-2 text-sm"
          value={searchParams?.get("isActive") || ""}
          onChange={(e) => setParam("isActive", e.target.value)}
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <button
        onClick={() => router.push("/recurring")}
        className="rounded border px-4 py-2 text-sm"
      >
        Reset
      </button>
    </div>
  );
}
