import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ModalProvider } from "@/components/modal-provider";

export const metadata: Metadata = {
  title: "ByteFlow Pro — Inventário & Vendas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#f9f9ff] text-slate-800 font-sans antialiased">
        <ModalProvider>
          {children}
        </ModalProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
