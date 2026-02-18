"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { loginSchema, type LoginSchema } from "../schema";

type LoginResponse = {
  accessToken: string;
  id: string;
  email: string;
};

export default function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values: LoginSchema) => {
    setServerError(null);
    try {
      const res = await api.post<LoginResponse>("/auth/login", values);
      setToken(res.data.accessToken);
      router.replace("/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login gagal. Coba lagi.";
      setServerError(msg);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="you@email.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="••••••••"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {form.formState.isSubmitting ? "Logging in..." : "Login"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-black underline">
          Register
        </Link>
      </p>
    </form>
  );
}
