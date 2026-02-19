import Link from "next/link";
import { Plus, Repeat } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="rounded-2xl border bg-white p-10 text-center">
      <h2 className="text-lg font-semibold">Belum ada data invoice</h2>
      <p className="mt-2 text-sm text-gray-600">
        Mulai dengan bikin invoice pertama kamu.
      </p>

      <div className="mt-6 flex items-center justify-center gap-2">
        <Link
          href="#"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </Link>

        <Link
          href="#"
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          Add Client
        </Link>

        
        <Link
          href="/recurring"
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          <Repeat className="h-4 w-4" />
          Recurring
        </Link>
      </div>
    </div>
  );
}
