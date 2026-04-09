import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { getSiteUrl } from '@/lib/site';
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Agent Intel — Singapore Property Agent Directory",
  description: "Search 39,000+ property agents, track rankings, and monitor agency movements in Singapore's real estate market.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="text-xl font-semibold tracking-tight text-zinc-50">
              Agent Intel
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium text-zinc-400">
              <Link href="/leaderboard" className="transition hover:text-zinc-100">Leaderboard</Link>
              <Link href="/movements" className="transition hover:text-zinc-100">Movements</Link>
              <Link href="/search" className="transition hover:text-zinc-100">Search</Link>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
