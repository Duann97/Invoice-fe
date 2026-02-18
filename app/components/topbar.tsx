"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
};

const NAV: NavItem[] = [
  { label: "Clients", href: "/clients" },
  { label: "Products", href: "/products" },
  { label: "Invoices", href: "/invoices" },
  { label: "Payments", href: "/payments" },
  { label: "Recurring", href: "/recurring" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const onLogout = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Left: Brand + main nav */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-lg font-semibold text-white">
            Invoice
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "transition",
                    active
                      ? "text-white"
                      : "text-white/70 hover:text-white hover:underline",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Profile + Logout */}
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Profile
          </Link>

          <button
            onClick={onLogout}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap gap-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-full px-3 py-1 text-xs border transition",
                  active
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/profile"
            className={[
              "rounded-full px-3 py-1 text-xs border transition",
              isActive(pathname, "/profile")
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            Profile
          </Link>

          <button
            onClick={onLogout}
            className="rounded-full px-3 py-1 text-xs border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
