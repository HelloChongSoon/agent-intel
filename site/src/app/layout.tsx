import localFont from "next/font/local";
import Link from "next/link";
import type { Metadata } from "next";
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl, getRequestSiteContext } from '@/lib/site';
import PageLoader from '@/components/PageLoader';
import MobileNav from '@/components/MobileNav';
import ThemeToggle from '@/components/ThemeToggle';
import WebVitals from '@/components/WebVitals';
import PostHogProvider from '@/components/PostHogProvider';
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})()` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PostHogProvider />
        <PageLoader />
        <WebVitals />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <nav className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
              {/* Brand mark — abstract upward bars representing data intelligence */}
              <svg viewBox="0 0 28 28" className="h-7 w-7 shrink-0" fill="none" aria-hidden="true">
                <rect x="3" y="16" width="5" height="9" rx="1.5" className="fill-blue-500" />
                <rect x="11.5" y="9" width="5" height="16" rx="1.5" className="fill-blue-400" />
                <rect x="20" y="3" width="5" height="22" rx="1.5" className="fill-cyan-400" />
              </svg>
              {context.isIntel ? 'PropNext Intel' : 'PropNext'}
            </Link>
            {/* Desktop nav */}
            <div className="hidden items-center gap-6 text-sm font-medium text-zinc-400 md:flex">
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
              <ThemeToggle />
            </div>
            {/* Mobile nav */}
            <MobileNav links={context.isIntel ? [
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/movements', label: 'Movements' },
              { href: '/guides/how-to-choose-a-property-agent-in-singapore', label: 'Guides' },
              { href: '/methodology', label: 'Methodology' },
            ] : [
              { href: '/about', label: 'About' },
              { href: '/products/intel', label: 'PropNext Intel' },
              { href: '/methodology', label: 'Methodology' },
              { href: '/contact', label: 'Contact' },
            ]} />
          </div>
        </nav>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-zinc-800/80 bg-zinc-950/85">
          <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-zinc-400 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="font-medium text-zinc-100">{context.isIntel ? 'PropNext Intel' : 'PropNext'}</div>
                <div className="mt-1">Singapore property agent rankings, profiles, and movement intelligence.</div>
                {context.isIntel && (
                  <div className="mt-2">
                    <a href="https://propnext.sg" className="text-zinc-500 transition hover:text-zinc-100">propnext.sg</a>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Platform</span>
                  <Link href="/methodology" className="transition hover:text-zinc-100">Methodology</Link>
                  <Link href="/data-sources" className="transition hover:text-zinc-100">Data Sources</Link>
                  <Link href="/contact" className="transition hover:text-zinc-100">Contact</Link>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Legal</span>
                  <Link href="/privacy-policy" className="transition hover:text-zinc-100">Privacy Policy</Link>
                  <Link href="/terms-of-use" className="transition hover:text-zinc-100">Terms of Use</Link>
                  <Link href="/disclaimer" className="transition hover:text-zinc-100">Disclaimer</Link>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-zinc-800/60 pt-4 text-xs text-zinc-500">
              &copy; {new Date().getFullYear()} PropNext. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
