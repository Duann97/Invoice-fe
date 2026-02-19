"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";

type DashboardSummaryResponse = any; 


export default function DashboardSummary() {
  const router = useRouter();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const params = useMemo(() => {
    return { limit: 5, dueSoonDays: 7, monthOffset: 0 };
  }, []);

  useEffect(() => {
    
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/dashboard/summary", { params });
        setData(res.data);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "Gagal load dashboard.";
        setError(msg);

        
        if (err?.response?.status === 401) {
          clearToken();
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [params, router]);

  if (loading) {
    return (
      <div className="rounded-xl border p-6 text-sm text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6">
      <div className="text-sm text-gray-600">Response:</div>
      <pre className="mt-3 overflow-auto rounded-md bg-gray-50 p-4 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
