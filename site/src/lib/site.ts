const fallbackUrl = 'https://agent-intel.vercel.app';

export function getSiteUrl() {
  const rawUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    fallbackUrl
  ).trim();

  const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  return normalizedUrl.replace(/\/$/, '');
}

export function getAbsoluteUrl(path: string = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
