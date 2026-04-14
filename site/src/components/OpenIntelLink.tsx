'use client';

import Link from 'next/link';
import posthog from 'posthog-js';

export default function OpenIntelLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-2xl bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white"
      onClick={() => posthog.capture('intel_product_opened')}
    >
      Open PropNext Intel
    </Link>
  );
}
