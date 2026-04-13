describe('route handlers', () => {
  it('returns a crawlable robots file for intel', async () => {
    const { GET } = await import('@/app/robots.txt/route');
    const response = await GET(new Request('https://intel.propnext.sg/robots.txt', {
      headers: { host: 'intel.propnext.sg' },
    }));
    const text = await response.text();

    expect(text).toContain('User-agent: *');
    expect(text).toContain('Allow: /');
    expect(text).toContain('Sitemap: https://intel.propnext.sg/sitemap.xml');
  });

  it('blocks crawling for cats', async () => {
    const { GET } = await import('@/app/robots.txt/route');
    const response = await GET(new Request('https://cats.propnext.sg/robots.txt', {
      headers: { host: 'cats.propnext.sg' },
    }));
    const text = await response.text();

    expect(text).toBe('User-agent: *\nDisallow: /\n');
  });

  it('returns only the core sitemap on the root domain', async () => {
    const { GET } = await import('@/app/sitemap.xml/route');
    const response = await GET(new Request('https://propnext.sg/sitemap.xml', {
      headers: { host: 'propnext.sg' },
    }));
    const text = await response.text();

    expect(text).toContain('<loc>https://propnext.sg/sitemap-core.xml</loc>');
    expect(text).not.toContain('sitemap-agents.xml');
  });

  it('returns the full sitemap index on the intel domain', async () => {
    const { GET } = await import('@/app/sitemap.xml/route');
    const response = await GET(new Request('https://intel.propnext.sg/sitemap.xml', {
      headers: { host: 'intel.propnext.sg' },
    }));
    const text = await response.text();

    expect(text).toContain('<loc>https://intel.propnext.sg/sitemap-core.xml</loc>');
    expect(text).toContain('<loc>https://intel.propnext.sg/sitemap-guides.xml</loc>');
    expect(text).toContain('<loc>https://intel.propnext.sg/sitemap-taxonomies.xml</loc>');
    expect(text).toContain('<loc>https://intel.propnext.sg/sitemap-agencies.xml</loc>');
    expect(text).toContain('<loc>https://intel.propnext.sg/sitemap-agents.xml</loc>');
  });

  it('returns root-shell URLs only in the root core sitemap', async () => {
    const { GET } = await import('@/app/sitemap-core.xml/route');
    const response = await GET(new Request('https://propnext.sg/sitemap-core.xml', {
      headers: { host: 'propnext.sg' },
    }));
    const text = await response.text();

    expect(text).toContain('<loc>https://propnext.sg/about</loc>');
    expect(text).toContain('<loc>https://propnext.sg/products/intel</loc>');
    expect(text).not.toContain('<loc>https://propnext.sg/leaderboard</loc>');
  });
});
