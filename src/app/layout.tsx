import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "SourceTrace | Verifiable ESG Scope-3 & Multi-Tier Supplier Audit Ledger",
  description:
    "AI-assisted, fraud-resistant Scope-3 emissions calculation and supplier audit platform with zero-trust verification and cryptographic ESG disclosure ledger.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
