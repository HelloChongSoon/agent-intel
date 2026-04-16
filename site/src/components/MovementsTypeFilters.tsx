'use client';

import Link from 'next/link';
import posthog from 'posthog-js';

const TYPE_LABELS: Record<string, string> = {
  agency_change: 'Agency Transfer',
  new_registration: 'New Registration',
  deregistration: 'Deregistration',
  reregistration: 'Re-registration',
};

interface MovementsTypeFiltersProps {
  selectedType?: string;
  searchQuery?: string;
  basePath?: string;
}

export default function MovementsTypeFilters({ selectedType, searchQuery, basePath = '/movements' }: MovementsTypeFiltersProps) {
  function buildHref(type?: string) {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (type) params.set('type', type);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildHref()}
        onClick={() => posthog.capture('movements_type_filter_applied', { type: null })}
        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${!selectedType ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
      >
        All
      </Link>
      {Object.entries(TYPE_LABELS).map(([key, label]) => (
        <Link
          key={key}
          href={buildHref(key)}
          onClick={() => posthog.capture('movements_type_filter_applied', { type: key })}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${selectedType === key ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
