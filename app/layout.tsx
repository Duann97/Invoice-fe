import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientShell from "@/app/components/client-shell";
import { ToastProvider } from "./components/ui/toast-provider";

const geistsans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoice App",
  description: "Invoice management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistsans.variable} ${geistMono.variable} antialiased`}>
       <ToastProvider> <ClientShell>{children}</ClientShell></ToastProvider>
      </body>
    </html>
  );
}
