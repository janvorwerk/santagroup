import { TRPCProvider } from "@/lib/trpc/providers";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santa App",
  description: "Organise tes échange de cadeaux",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full overflow-y-auto p-4">
      <body className="h-full">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
