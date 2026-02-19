import Link from "next/link";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      {children}
    </span>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{desc}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Marketing header (NO app topbar here) */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/25 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-8">
            <div className="text-lg font-semibold text-white">Invoice</div>
            <nav className="hidden items-center gap-6 text-sm md:flex">
              <a
                href="#fitur"
                className="text-white/70 hover:text-white hover:underline"
              >
                Fitur
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-16 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="md:col-span-2">
            <Pill>Invoice management untuk bisnis & UMKM</Pill>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
              Invoice App,
              <span className="block text-white/70">pantau pembayaran,</span>
              <span className="block text-white/70">dan recurring otomatis.</span>
            </h1>

            

            <div className="mt-8 flex flex-wrap items-center gap-3">
             

              <a
                href="#fitur"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Lihat fitur
              </a>

              
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Ringkas</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  Status invoice, payment, dan jatuh tempo mudah dipantau.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Rapi</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  Detail client & produk konsisten, minim salah input.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Fitur utama</h2>
            
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Client Management"
            desc="Buat & kelola client. Akses detail client untuk lihat invoice miliknya."
          />
          <FeatureCard
            title="Product/Service"
            desc="Kelola produk/layanan untuk dipakai saat create invoice."
          />
          <FeatureCard
            title="Invoice Lifecycle"
            desc="Invoice rapi: item, total, status, filter, dan navigasi jelas."
          />
          <FeatureCard
            title="Payments Tracking"
            desc="Catat pembayaran dan pantau cashflow."
          />
          <FeatureCard
            title="Recurring Invoice"
            desc="Rule otomatis: jadwal, interval, aktif/nonaktif, dan generate invoice."
          />
          <FeatureCard
            title="Profile"
            desc="Update fullName, companyName, address, dan avatar."
          />
        </div>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto max-w-6xl px-4 text-sm text-white/50">
          © {new Date().getFullYear()} Invoice App
        </div>
      </footer>
    </div>
  );
}
