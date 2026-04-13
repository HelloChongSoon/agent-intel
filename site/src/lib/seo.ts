import type { Metadata } from 'next';
import { getRequestAbsoluteUrl, getRequestSiteContext } from '@/lib/site';

interface MetadataOptions {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
}

export async function createPageMetadata({
  title,
  description,
  path = '/',
  noindex = false,
}: MetadataOptions): Promise<Metadata> {
  const context = await getRequestSiteContext();
  const canonical = await getRequestAbsoluteUrl(path);
  const siteTitle = context.isIntel ? 'PropNext Intel' : 'PropNext';
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  const shouldNoindex = noindex || context.isCats;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: siteTitle,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
    robots: shouldNoindex ? { index: false, follow: false } : undefined,
  };
}
