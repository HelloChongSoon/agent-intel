'use client';

import Link from 'next/link';
import posthog from 'posthog-js';

interface SearchResultLinkProps {
  ceaNumber: string;
  name: string;
  agency?: string | null;
  query: string;
}

export default function SearchResultLink({ ceaNumber, name, agency, query }: SearchResultLinkProps) {
  return (
    <Link
      href={`/agent/${ceaNumber}`}
      onClick={() => posthog.capture('search_result_agent_clicked', { cea_number: ceaNumber, agency: agency ?? null, query })}
      className="text-sm font-medium text-zinc-100 transition hover:text-white"
    >
      {name}
    </Link>
  );
}
