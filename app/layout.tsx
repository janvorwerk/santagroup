import type { Metadata } from 'next';
import './globals.css';
import { TRPCProvider } from '@/lib/trpc/providers';

export const metadata: Metadata = {
  title: 'Santa App',
  description: 'A modern web application built with Next.js 16',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}

