import Link from 'next/link';

interface LeaderboardPaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams?: Record<string, string>;
}

export default function LeaderboardPagination({
  currentPage,
  totalPages,
  searchParams = {},
}: LeaderboardPaginationProps) {
  if (totalPages <= 1) return null;

  function buildHref(page: number): string {
    const params = new URLSearchParams({ ...searchParams, page: String(page) });
    return `/leaderboard?${params.toString()}`;
  }

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
        >
          Previous
        </Link>
      )}
      {pages.map((page, index) =>
        page === '...' ? (
          <span key={`gap-${index}`} className="px-3 py-2 text-sm text-zinc-600">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              page === currentPage
                ? 'border-zinc-100 bg-zinc-100 text-zinc-950'
                : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            {page}
          </Link>
        )
      )}
      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
        >
          Next
        </Link>
      )}
    </div>
  );
}
