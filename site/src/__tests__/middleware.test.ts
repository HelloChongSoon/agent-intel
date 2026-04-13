import { NextRequest, NextResponse } from 'next/server';

describe('site middleware', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('redirects non-shell root-domain routes to the intel host', async () => {
    const updateSession = jest.fn();

    jest.doMock('@/utils/supabase/middleware', () => ({
      updateSession,
    }));

    const { middleware } = await import('@/middleware');
    const request = new NextRequest('https://propnext.sg/leaderboard?year=2026', {
      headers: { host: 'propnext.sg' },
    });

    const response = await middleware(request);

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://intel.propnext.sg/leaderboard?year=2026');
    expect(updateSession).not.toHaveBeenCalled();
  });

  it('keeps root-shell routes on the root domain and falls through to session middleware', async () => {
    const downstream = NextResponse.next();
    downstream.headers.set('x-test-middleware', 'passed-through');
    const updateSession = jest.fn(async () => downstream);

    jest.doMock('@/utils/supabase/middleware', () => ({
      updateSession,
    }));

    const { middleware } = await import('@/middleware');
    const request = new NextRequest('https://propnext.sg/about', {
      headers: { host: 'propnext.sg' },
    });

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-test-middleware')).toBe('passed-through');
    expect(updateSession).toHaveBeenCalledTimes(1);
  });

  it('adds a noindex header on the cats host', async () => {
    const downstream = NextResponse.next();
    const updateSession = jest.fn(async () => downstream);

    jest.doMock('@/utils/supabase/middleware', () => ({
      updateSession,
    }));

    const { middleware } = await import('@/middleware');
    const request = new NextRequest('https://cats.propnext.sg/', {
      headers: { host: 'cats.propnext.sg' },
    });

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(updateSession).toHaveBeenCalledTimes(1);
  });
});
