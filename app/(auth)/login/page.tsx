"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      const accessToken = res.data?.accessToken;

      if (!accessToken) {
        setErr("Login sukses tapi token tidak ditemukan.");
        return;
      }

      setToken(accessToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", accessToken);
      }

      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-white flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 p-6"
      >
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-white/60">
          Masuk untuk mengelola invoice kamu.
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder:text-white/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white placeholder:text-white/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {err && (
            <div className="rounded-xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-60 hover:bg-white/90"
          >
            {loading ? "Loading..." : "Login"}
          </button>

          <p className="text-center text-sm text-white/60">
            Belum punya akun?{" "}
            <Link href="/register" className="underline font-medium">
              Register
            </Link>
          </p>

          <p className="text-center text-xs text-white/40">
            Kembali ke{" "}
            <Link href="/" className="underline">
              Homepage
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
