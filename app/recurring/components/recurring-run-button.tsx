"use client";

import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function RecurringRunButton({
  recurringId,
}: {
  recurringId: string;
}) {
  const token = getToken();

  const run = async () => {
    if (!confirm("Generate invoice now?")) return;

    await api.post(
      "/recurring/run",
      { id: recurringId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Invoice generated");
  };

  return (
    <button className="underline text-blue-600" onClick={run}>
      Run
    </button>
  );
}
