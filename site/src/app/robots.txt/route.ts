import { getSitemapContext } from '@/lib/sitemap';

export async function GET(request: Request) {
  const { variant, siteUrl } = getSitemapContext(request);

  if (variant === 'cats') {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  const rules = variant === 'root'
    ? 'User-agent: *\nAllow: /\n'
    : 'User-agent: *\nAllow: /\n';

  const body = `${rules}Sitemap: ${siteUrl}/sitemap.xml\n`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
