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
      <body className="min-h-screen antialiased selection:bg-accent selection:text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
