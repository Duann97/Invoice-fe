"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function VerifyEmailPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("Memverifikasi email...");

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage("Email berhasil diverifikasi. Silakan login.");
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Token tidak valid / sudah expired.";
        setStatus("error");
        setMessage(msg);
      }
    };

    run();
  }, [token]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border p-6">
        <h1 className="text-xl font-semibold">Verify Email</h1>
        <p
          className={`mt-3 text-sm ${
            status === "error" ? "text-red-600" : "text-gray-700"
          }`}
        >
          {message}
        </p>

        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex rounded-md bg-black px-4 py-2 text-white"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
