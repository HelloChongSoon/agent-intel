import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      {/* Large 404 */}
      <div className="relative mb-6">
        <span className="text-[10rem] font-black leading-none tracking-tighter text-zinc-200 dark:text-zinc-900 select-none sm:text-[14rem]">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 sm:w-32" />
        </div>
      </div>

      {/* Message */}
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-100 dark:text-zinc-100 sm:text-3xl">
        Page not found
      </h1>
      <p className="mb-8 max-w-md text-zinc-500 dark:text-zinc-400">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Go home
        </Link>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 dark:border-zinc-700 bg-zinc-900 dark:bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
        >
          Leaderboard
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 dark:border-zinc-700 bg-zinc-900 dark:bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          Search agents
        </Link>
      </div>
    </div>
  );
}
