// app/invoices/page.tsx
import { Suspense } from "react";
import InvoicesClient from "./components/invoices-client"; 

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            Loading...
          </div>
        </div>
      }
    >
      <InvoicesClient />
    </Suspense>
  );
}
