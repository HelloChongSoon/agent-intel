import Link from 'next/link';
import { getMovements } from '@/lib/queries';
import Pagination from '@/components/Pagination';

interface Props {
  searchParams: Promise<{ page?: string; type?: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  agency_change: 'Agency Transfer',
  new_registration: 'New Registration',
  deregistration: 'Deregistration',
  reregistration: 'Re-registration',
};

const TYPE_COLORS: Record<string, string> = {
  agency_change: 'bg-blue-100 text-blue-700',
  new_registration: 'bg-green-100 text-green-700',
  deregistration: 'bg-red-100 text-red-700',
  reregistration: 'bg-purple-100 text-purple-700',
};

export default async function MovementsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const type = params.type || undefined;
  const pageSize = 20;

  const { rows, total } = await getMovements({ page, pageSize, type });
  const totalPages = Math.ceil(total / pageSize);

  const filterParams: Record<string, string> = {};
  if (type) filterParams.type = type;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Movements</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total.toLocaleString()} movements tracked
            {type && <span> — filtered by {TYPE_LABELS[type] || type}</span>}
          </p>
        </div>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 mb-4">
        <Link
          href="/movements"
          className={`px-3 py-1.5 text-xs font-medium rounded-full ${!type ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All
        </Link>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/movements?type=${key}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-full ${type === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((movement) => (
          <div key={movement.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/agent/${movement.cea_number}`} className="text-sm font-medium text-blue-600 hover:underline">
                  {movement.agent_name}
                </Link>
                <span className="text-xs text-gray-400">{movement.cea_number}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {movement.type === 'agency_change' && (
                  <>{movement.previous_agency} → {movement.new_agency}</>
                )}
                {movement.type === 'new_registration' && (
                  <>Joined {movement.new_agency}</>
                )}
                {movement.type === 'deregistration' && (
                  <>Left {movement.previous_agency}</>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${TYPE_COLORS[movement.type] || 'bg-gray-100 text-gray-600'}`}>
                {TYPE_LABELS[movement.type] || movement.type}
              </span>
              <span className="text-xs text-gray-400 w-24 text-right">
                {new Date(movement.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-center py-8 text-gray-400">No movements found</div>
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/movements" searchParams={filterParams} />
    </div>
  );
}
