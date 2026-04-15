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

    const pageModule = await import('@/app/page');
    const metadata = await pageModule.generateMetadata();

    expect(createPageMetadata).toHaveBeenCalledWith({
      title: 'Singapore Property Agent Rankings & Intelligence',
      description: 'Compare Singapore property agents by transaction volume, track agency movements, and explore agent profiles powered by official CEA data.',
      path: '/',
    });
    expect(metadata).toEqual({
      title: 'Singapore Property Agent Rankings & Intelligence',
      description: 'Compare Singapore property agents by transaction volume, track agency movements, and explore agent profiles powered by official CEA data.',
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

    const pageModule = await import('@/app/page');
    await pageModule.generateMetadata();

    expect(createPageMetadata).toHaveBeenCalledWith({
      title: 'PropNext — Singapore Property Intelligence Platform',
      description: 'PropNext builds property intelligence tools for Singapore consumers, starting with agent rankings, movement tracking, and profile data.',
      path: '/',
    });
  });

  it('marks missing guides as noindex in metadata', async () => {
    const createPageMetadata = jest.fn(async (value) => value);

    jest.doMock('@/lib/seo', () => ({
      createPageMetadata,
    }));

    const guideModule = await import('@/app/guides/[slug]/page');
    await guideModule.generateMetadata({
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

    const guideModule = await import('@/app/guides/[slug]/page');
    await guideModule.generateMetadata({
      params: Promise.resolve({ slug: 'how-to-verify-a-property-agent-in-singapore' }),
    });

    expect(createPageMetadata).toHaveBeenCalledWith({
      title: 'How To Verify a Property Agent in Singapore',
      description: 'Use CEA number, agency affiliation, registration period, and transaction history to verify a Singapore property agent.',
      path: '/guides/how-to-verify-a-property-agent-in-singapore',
    });
  });
});
