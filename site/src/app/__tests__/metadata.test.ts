describe('page metadata', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('builds intel homepage metadata with the product positioning', async () => {
    const createPageMetadata = jest.fn(async (value) => value);

    jest.doMock('@/lib/seo', () => ({
      createPageMetadata,
    }));
    jest.doMock('@/lib/site', () => ({
      getRequestSiteContext: jest.fn(async () => ({
        isIntel: true,
      })),
    }));

    const module = await import('@/app/page');
    const metadata = await module.generateMetadata();

    expect(createPageMetadata).toHaveBeenCalledWith({
      title: 'PropNext Intel',
      description: 'Singapore property agent rankings, profiles, and movement intelligence.',
      path: '/',
    });
    expect(metadata).toEqual({
      title: 'PropNext Intel',
      description: 'Singapore property agent rankings, profiles, and movement intelligence.',
      path: '/',
    });
  });

  it('builds root homepage metadata with the brand-shell positioning', async () => {
    const createPageMetadata = jest.fn(async (value) => value);

    jest.doMock('@/lib/seo', () => ({
      createPageMetadata,
    }));
    jest.doMock('@/lib/site', () => ({
      getRequestSiteContext: jest.fn(async () => ({
        isIntel: false,
      })),
    }));

    const module = await import('@/app/page');
    await module.generateMetadata();

    expect(createPageMetadata).toHaveBeenCalledWith({
      title: 'PropNext',
      description: 'PropNext is building Singapore property intelligence products for Singapore consumers and market watchers.',
      path: '/',
    });
  });

  it('marks missing guides as noindex in metadata', async () => {
    const createPageMetadata = jest.fn(async (value) => value);

    jest.doMock('@/lib/seo', () => ({
      createPageMetadata,
    }));

    const module = await import('@/app/guides/[slug]/page');
    await module.generateMetadata({
      params: Promise.resolve({ slug: 'missing-guide' }),
    });

    expect(createPageMetadata).toHaveBeenCalledWith({
      title: 'Guide',
      description: 'Consumer guide',
      path: '/guides/missing-guide',
      noindex: true,
    });
  });

  it('builds guide metadata from the content record when the guide exists', async () => {
    const createPageMetadata = jest.fn(async (value) => value);

    jest.doMock('@/lib/seo', () => ({
      createPageMetadata,
    }));

    const module = await import('@/app/guides/[slug]/page');
    await module.generateMetadata({
      params: Promise.resolve({ slug: 'how-to-verify-a-property-agent-in-singapore' }),
    });

    expect(createPageMetadata).toHaveBeenCalledWith({
      title: 'How To Verify a Property Agent in Singapore',
      description: 'Use CEA number, agency affiliation, registration period, and transaction history to verify a Singapore property agent.',
      path: '/guides/how-to-verify-a-property-agent-in-singapore',
    });
  });
});
