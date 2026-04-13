import { type NextRequest, NextResponse } from 'next/server';
import { getCanonicalHost, getVariantForHost, isRootShellPath, normalizeHost } from '@/lib/hosts';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const host = normalizeHost(request.headers.get('x-forwarded-host') || request.headers.get('host'));
  const pathname = request.nextUrl.pathname;
  const variant = getVariantForHost(host);

  if (variant === 'root' && !isRootShellPath(pathname)) {
    const url = request.nextUrl.clone();
    url.host = getCanonicalHost('intel');
    url.protocol = 'https';
    return NextResponse.redirect(url, 308);
  }

  const response = await updateSession(request);

  if (variant === 'cats') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - common image file extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
