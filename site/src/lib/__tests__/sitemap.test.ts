import { buildSitemapIndex, buildUrlSet, getSitemapContext } from '@/lib/sitemap';

describe('sitemap helpers', () => {
  it('builds a valid urlset payload', () => {
    const xml = buildUrlSet([
      { loc: 'https://intel.propnext.sg/leaderboard', lastmod: '2026-04-13T00:00:00.000Z' },
    ]);

    expect(xml).toContain('<urlset');
    expect(xml).toContain('<loc>https://intel.propnext.sg/leaderboard</loc>');
    expect(xml).toContain('<lastmod>2026-04-13T00:00:00.000Z</lastmod>');
  });

  it('builds a valid sitemap index payload', () => {
    const xml = buildSitemapIndex([
      'https://intel.propnext.sg/sitemap-core.xml',
      'https://intel.propnext.sg/sitemap-agents.xml',
    ]);

    expect(xml).toContain('<sitemapindex');
    expect(xml).toContain('<loc>https://intel.propnext.sg/sitemap-core.xml</loc>');
    expect(xml).toContain('<loc>https://intel.propnext.sg/sitemap-agents.xml</loc>');
  });

  it('derives the site variant and canonical site URL from the request host', () => {
    const intelRequest = new Request('https://intel.propnext.sg/sitemap.xml', {
      headers: { host: 'intel.propnext.sg' },
    });
    const rootRequest = new Request('https://propnext.sg/sitemap.xml', {
      headers: { host: 'propnext.sg' },
    });
    const catsRequest = new Request('https://cats.propnext.sg/robots.txt', {
      headers: { host: 'cats.propnext.sg' },
    });

    expect(getSitemapContext(intelRequest)).toEqual({
      variant: 'intel',
      siteUrl: 'https://intel.propnext.sg',
    });
    expect(getSitemapContext(rootRequest)).toEqual({
      variant: 'root',
      siteUrl: 'https://propnext.sg',
    });
    expect(getSitemapContext(catsRequest)).toEqual({
      variant: 'cats',
      siteUrl: 'https://cats.propnext.sg',
    });
  });
});
