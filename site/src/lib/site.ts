import { headers } from 'next/headers';
import { getCanonicalHost, getVariantForHost, type SiteVariant } from '@/lib/hosts';

export function normalizeUrl(rawUrl: string): string {
  const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  return withProtocol.replace(/\/$/, '');
}

export function getDefaultSiteUrl(variant: SiteVariant = 'intel') {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
  }

  return `https://${getCanonicalHost(variant)}`;
}

export function getAbsoluteUrl(path: string = '/', siteUrl: string = getDefaultSiteUrl()) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}

export function getVariantSiteUrl(variant: SiteVariant) {
  return getAbsoluteUrl('/', `https://${getCanonicalHost(variant)}`);
}

export async function getRequestSiteContext() {
  const headerStore = await headers();
  const headerHost =
    headerStore.get('x-forwarded-host') ||
    headerStore.get('host') ||
    getCanonicalHost('intel');
  const protocol = headerStore.get('x-forwarded-proto') || 'https';
  const variant = getVariantForHost(headerHost);
  const canonicalHost = getCanonicalHost(variant);
  const siteUrl = `${protocol}://${canonicalHost}`;

  return {
    host: canonicalHost,
    protocol,
    variant,
    siteUrl,
    isRoot: variant === 'root',
    isIntel: variant === 'intel',
    isCats: variant === 'cats',
    siteName: variant === 'intel' ? 'PropNext Intel' : 'PropNext',
    organizationName: 'PropNext',
    productName: 'PropNext Intel',
  };
}

export async function getRequestAbsoluteUrl(path: string = '/') {
  const { siteUrl } = await getRequestSiteContext();
  return getAbsoluteUrl(path, siteUrl);
}
