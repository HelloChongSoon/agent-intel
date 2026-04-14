'use client';

import Link from 'next/link';
import posthog from 'posthog-js';

interface LeaderboardAgentLinkProps {
  ceaNumber: string;
  name: string;
  agency?: string | null;
  rank: number;
}

export default function LeaderboardAgentLink({ ceaNumber, name, agency, rank }: LeaderboardAgentLinkProps) {
  return (
    <Link
      href={`/agent/${ceaNumber}`}
      onClick={() => posthog.capture('leaderboard_agent_clicked', { cea_number: ceaNumber, agency: agency ?? null, rank })}
      className="block text-base font-medium text-zinc-100 transition hover:text-white md:text-lg"
    >
      {name}
    </Link>
  );
}
