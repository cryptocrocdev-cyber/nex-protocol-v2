import type { Metadata } from "next";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";

export const metadata: Metadata = {
  title: "NEX Protocol — Reverse XEN on X1",
  description:
    "NEX Protocol is the deflationary inverse of XEN: prestige, mint, burn, forge. 100 prestige tiers. No admin. Immutable.",
  keywords: ["Prestige", "NEX", "XEN", "X1", "burn", "deflationary", "crypto", "immutable"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-[#e8e4dd] antialiased">
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}