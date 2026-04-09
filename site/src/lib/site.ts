const fallbackUrl = 'https://agent-intel.vercel.app';

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    fallbackUrl
  ).replace(/\/$/, '');
}

export function getAbsoluteUrl(path: string = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
