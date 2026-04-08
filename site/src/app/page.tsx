import SearchBar from '@/components/SearchBar';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Agent Intel</h1>
        <p className="text-lg text-gray-500">
          Singapore property agent directory — rankings, profiles, and agency movements.
        </p>
      </div>

      <SearchBar />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mt-4">
        <Link
          href="/leaderboard"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
        >
          <h2 className="font-semibold text-gray-900 mb-1">Leaderboard</h2>
          <p className="text-sm text-gray-500">Agent rankings by transaction volume</p>
        </Link>

        <Link
          href="/movements"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
        >
          <h2 className="font-semibold text-gray-900 mb-1">Movements</h2>
          <p className="text-sm text-gray-500">Agency transfers and registrations</p>
        </Link>

        <Link
          href="/leaderboard?agency=ERA+REALTY+NETWORK+PTE+LTD"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
        >
          <h2 className="font-semibold text-gray-900 mb-1">ERA Agents</h2>
          <p className="text-sm text-gray-500">Filter leaderboard by ERA Realty</p>
        </Link>
      </div>
    </div>
  );
}
