'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import posthog from 'posthog-js';
import { startNavigationFeedback } from '@/components/RouteLoadingIndicator';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      posthog.capture('agent_search_submitted', { query: query.trim() });
      startNavigationFeedback();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex flex-col gap-3 sm:relative sm:block">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search agents by name or CEA number..."
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 px-5 py-4 text-base text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-600 sm:pr-28 sm:text-lg"
        />
        <button
          type="submit"
          className="h-11 rounded-xl bg-zinc-100 px-4 text-sm font-medium text-zinc-950 transition hover:bg-white sm:absolute sm:right-2 sm:top-1/2 sm:h-auto sm:-translate-y-1/2 sm:py-2"
        >
          Search
        </button>
      </div>
    </form>
  );
}
