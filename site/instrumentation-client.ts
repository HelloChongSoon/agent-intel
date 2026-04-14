import posthog from 'posthog-js';

const rawPosthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

function getPosthogUiHost(apiHost: string) {
  try {
    const url = new URL(apiHost);
    const match = url.hostname.match(/^([a-z0-9-]+)\.i\.posthog\.com$/i);
    if (match) {
      return `https://${match[1]}.posthog.com`;
    }

    return url.origin;
  } catch {
    return 'https://us.posthog.com';
  }
}

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: '/ingest',
  ui_host: getPosthogUiHost(rawPosthogHost),
  defaults: '2026-01-30',
  capture_exceptions: true,
  debug: process.env.NODE_ENV === 'development',
});
