"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingClientRedirect() {
  const router = useRouter();

  useEffect(() => {
    // kompatibel sama project kamu:
    // auth.ts pakai "accessToken"
    // api.ts interceptor kamu pakai "token"
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") || localStorage.getItem("token")
        : null;

    if (token) router.replace("/dashboard");
  }, [router]);

  return null;
}
