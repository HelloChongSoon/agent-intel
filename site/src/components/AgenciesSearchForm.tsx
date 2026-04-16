'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AgenciesSearchForm({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue || '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/agencies?q=${encodeURIComponent(trimmed)}` : '/agencies');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="m13 13 4 4" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search agencies..."
          className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
        />
      </div>
      <button
        type="submit"
        className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
      >
        Search
      </button>
      {defaultValue && (
        <button
          type="button"
          onClick={() => { setQuery(''); router.push('/agencies'); }}
          className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 text-sm text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300"
        >
          Clear
        </button>
      )}
    </form>
  );
}
