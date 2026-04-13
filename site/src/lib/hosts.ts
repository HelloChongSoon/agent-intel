export type SiteVariant = 'root' | 'intel' | 'cats';

const DEFAULT_HOSTS: Record<SiteVariant, string> = {
  root: 'propnext.sg',
  intel: 'intel.propnext.sg',
  cats: 'cats.propnext.sg',
};

export function normalizeHost(host: string | null | undefined): string {
  return (host || '').trim().toLowerCase().replace(/:\d+$/, '');
}

export function getVariantForHost(host: string | null | undefined): SiteVariant {
  const normalized = normalizeHost(host);

  if (normalized === DEFAULT_HOSTS.root || normalized === `www.${DEFAULT_HOSTS.root}`) {
    return 'root';
  }

  if (normalized === DEFAULT_HOSTS.cats || normalized.startsWith('cats.')) {
    return 'cats';
  }

  return 'intel';
}

export function getCanonicalHost(variant: SiteVariant): string {
  return DEFAULT_HOSTS[variant];
}

export function isRootShellPath(pathname: string): boolean {
  return [
    '/',
    '/about',
    '/contact',
    '/methodology',
    '/products/intel',
    '/robots.txt',
    '/sitemap.xml',
    '/sitemap-core.xml',
    '/favicon.ico',
  ].includes(pathname);
}
