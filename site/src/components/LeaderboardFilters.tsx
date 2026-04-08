'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface LeaderboardFiltersProps {
  years: number[];
  agencies: string[];
  propertyTypes: string[];
  transactionTypes: string[];
  selectedYear: number;
  selectedAgency?: string;
  selectedPropertyType?: string;
  selectedTransactionType?: string;
}

function formatFilterLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

function SelectChevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  disabled = false,
  children,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-400">{label}</span>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          className="h-14 w-full appearance-none rounded-2xl border border-zinc-800 bg-zinc-900/90 px-5 pr-12 text-lg font-medium text-zinc-100 outline-none transition focus:border-zinc-600 disabled:cursor-not-allowed disabled:text-zinc-500"
        >
          {children}
        </select>
        <SelectChevron />
      </div>
    </label>
  );
}

export default function LeaderboardFilters({
  years,
  agencies,
  propertyTypes,
  transactionTypes,
  selectedYear,
  selectedAgency,
  selectedPropertyType,
  selectedTransactionType,
}: LeaderboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    params.delete('page');

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/leaderboard?${query}` : '/leaderboard');
    });
  }

  return (
    <div className={`grid gap-4 lg:grid-cols-[220px_minmax(0,1.25fr)_1fr_1fr] ${isPending ? 'opacity-80' : ''}`}>
      <FilterSelect
        label="Year"
        value={String(selectedYear)}
        onChange={(value) => updateParams({ year: value })}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Current agency"
        value={selectedAgency || ''}
        onChange={(value) => updateParams({ agency: value || undefined })}
      >
        <option value="">All agencies</option>
        {agencies.map((agency) => (
          <option key={agency} value={agency}>
            {agency}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Property Type"
        value={selectedPropertyType || ''}
        onChange={(value) => updateParams({ propertyType: value || undefined })}
      >
        <option value="">All types</option>
        {propertyTypes.map((propertyType) => (
          <option key={propertyType} value={propertyType}>
            {formatFilterLabel(propertyType)}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Transaction Type"
        value={selectedTransactionType || ''}
        onChange={(value) => updateParams({ transactionType: value || undefined })}
      >
        <option value="">All types</option>
        {transactionTypes.map((transactionType) => (
          <option key={transactionType} value={transactionType}>
            {formatFilterLabel(transactionType)}
          </option>
        ))}
      </FilterSelect>
    </div>
  );
}
