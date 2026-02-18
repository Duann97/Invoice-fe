import Link from "next/link";

export default function PublicTopbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070A12]/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-semibold text-white">
            Invoice
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-white/70 md:flex">
            <a href="#features" className="hover:text-white">Fitur</a>
            <a href="#how" className="hover:text-white">Cara kerja</a>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
