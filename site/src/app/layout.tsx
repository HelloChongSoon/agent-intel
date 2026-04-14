import localFont from "next/font/local";
import Link from "next/link";
import type { Metadata } from "next";
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl, getRequestSiteContext } from '@/lib/site';
import RouteLoadingIndicator from '@/components/RouteLoadingIndicator';
import WebVitals from '@/components/WebVitals';
import PostHogProvider from '@/components/PostHogProvider';
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

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const context = await getRequestSiteContext();
  const title = context.isIntel ? 'PropNext Intel' : 'PropNext';
  const description = context.isIntel
    ? "Singapore property agent rankings, profiles, and movement intelligence."
    : "PropNext is building Singapore property intelligence products, starting with PropNext Intel.";

  const metadata = await createPageMetadata({
    title,
    description,
    path: '/',
  });

  return {
    ...metadata,
    metadataBase: new URL(context.siteUrl),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getRequestSiteContext();
  const organizationUrl = await getRequestAbsoluteUrl('/');
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: context.organizationName,
    url: organizationUrl,
    brand: {
      '@type': 'Brand',
      name: context.productName,
    },
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PostHogProvider />
        <RouteLoadingIndicator />
        <WebVitals />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <nav className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="text-xl font-semibold tracking-tight text-zinc-50">
              {context.isIntel ? 'PropNext Intel' : 'PropNext'}
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium text-zinc-400">
              {context.isIntel ? (
                <>
                  <Link href="/leaderboard" className="transition hover:text-zinc-100">Leaderboard</Link>
                  <Link href="/movements" className="transition hover:text-zinc-100">Movements</Link>
                  <Link href="/guides/how-to-choose-a-property-agent-in-singapore" className="transition hover:text-zinc-100">Guides</Link>
                  <Link href="/methodology" className="transition hover:text-zinc-100">Methodology</Link>
                </>
              ) : (
                <>
                  <Link href="/about" className="transition hover:text-zinc-100">About</Link>
                  <Link href="/products/intel" className="transition hover:text-zinc-100">PropNext Intel</Link>
                  <Link href="/methodology" className="transition hover:text-zinc-100">Methodology</Link>
                  <Link href="/contact" className="transition hover:text-zinc-100">Contact</Link>
                </>
              )}
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-zinc-800/80 bg-zinc-950/85">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-zinc-400 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium text-zinc-100">{context.isIntel ? 'PropNext Intel' : 'PropNext'}</div>
              <div className="mt-1">Singapore property agent rankings, profiles, and movement intelligence.</div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/methodology" className="transition hover:text-zinc-100">Methodology</Link>
              <Link href="/data-sources" className="transition hover:text-zinc-100">Data Sources</Link>
              <Link href="/contact" className="transition hover:text-zinc-100">Contact</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
