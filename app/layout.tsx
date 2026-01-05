/**
 * Copyright (C) 2026 Jan Vorwerk
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { TRPCProvider } from "@/lib/trpc/providers";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santa Group",
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
