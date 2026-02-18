"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "@/lib/api";
import { registerSchema, type RegisterSchema } from "../schema";

type RegisterResponse = {
  message: string;
};

export default function RegisterForm() {
  const router = useRouter();
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const onSubmit = async (values: RegisterSchema) => {
    setServerMsg(null);
    setServerError(null);

    try {
      const payload: any = {
        email: values.email,
        password: values.password,
      };

      // hanya kirim fullName kalau ada
      if (values.fullName && values.fullName.trim().length > 0) {
        payload.fullName = values.fullName.trim();
      }

      const res = await api.post<RegisterResponse>("/auth/register", payload);

      setServerMsg(
        res.data?.message ||
          "Register berhasil. Cek email kamu untuk verifikasi."
      );

      // arahkan ke login setelah register
      setTimeout(() => {
        router.replace("/login");
      }, 800);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Register gagal. Coba lagi.";
      setServerError(msg);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nama (opsional)</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="Duan"
          {...form.register("fullName")}
        />
        {form.formState.errors.fullName && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.fullName.message}
          </p>
        )}
      </div>

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
          placeholder="Minimal 6 karakter"
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

      {serverMsg && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {serverMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {form.formState.isSubmitting ? "Creating..." : "Create account"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-black underline">
          Login
        </Link>
      </p>
    </form>
  );
}
