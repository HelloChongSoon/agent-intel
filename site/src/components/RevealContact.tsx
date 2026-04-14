'use client';

import { useState } from 'react';
import posthog from 'posthog-js';

interface RevealContactProps {
  kind: 'phone' | 'email';
  value?: string | null;
}

export default function RevealContact({ kind, value }: RevealContactProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!value) {
    return <span className="text-zinc-500">—</span>;
  }

  const href = kind === 'phone' ? `tel:${value}` : `mailto:${value}`;
  const buttonLabel = kind === 'phone' ? 'Show phone' : 'Show email';

  if (isVisible) {
    return (
      <a href={href} className="text-zinc-100 transition hover:text-white">
        {value}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setIsVisible(true);
        posthog.capture('agent_contact_revealed', { kind });
      }}
      className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
      aria-label={buttonLabel}
    >
      {buttonLabel}
    </button>
  );
}
