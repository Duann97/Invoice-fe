"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/app/components/topbar";
import SiteBackground from "@/app/components/site-background";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

function isPublicRoute(pathname: string | null) {
  if (!pathname) return false;
  return PUBLIC_ROUTES.includes(pathname);
}

export default function ClientShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const showAppTopbar = !isPublicRoute(pathname);

  return (
    <>
      <SiteBackground />
      {showAppTopbar ? <Topbar /> : null}
      <main className="min-h-screen">{children}</main>
    </>
  );
}
