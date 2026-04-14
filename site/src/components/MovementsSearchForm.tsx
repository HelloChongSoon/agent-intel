'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { startNavigationFeedback } from '@/components/RouteLoadingIndicator';

interface MovementsSearchFormProps {
  defaultValue: string;
  movementType?: string;
}

export default function MovementsSearchForm({ defaultValue, movementType }: MovementsSearchFormProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    posthog.capture('movements_searched', {
      query: query.trim(),
      movement_type: movementType ?? null,
    });
    const params = new URLSearchParams();
    if (movementType) params.set('type', movementType);
    if (query.trim()) params.set('q', query.trim());
    startNavigationFeedback();
    router.push(`/movements${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
      <input
        type="search"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by salesperson name or reg. no."
        className="h-11 flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
      />
      <button
        type="submit"
        className="h-11 rounded-2xl border border-zinc-800 bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white"
      >
        Search
      </button>
    </form>
  );
}
