'use client';

import type { AgencyOption } from '@/lib/queries';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import posthog from 'posthog-js';
import { startNavigationFeedback } from '@/components/PageLoader';

interface LeaderboardFiltersProps {
  years: number[];
  agencies: AgencyOption[];
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

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m13 13 4 4" />
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
          className="h-12 w-full appearance-none rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 pr-10 text-sm font-medium text-zinc-100 outline-none transition focus:border-zinc-600 disabled:cursor-not-allowed disabled:text-zinc-500 sm:h-14 sm:px-5 sm:pr-12 sm:text-lg"
        >
          {children}
        </select>
        <SelectChevron />
      </div>
    </label>
  );
}

function AgencyCombobox({
  agencies,
  selectedAgency,
  onChange,
}: {
  agencies: AgencyOption[];
  selectedAgency?: string;
  onChange: (value?: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAgencies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return agencies;

    return agencies.filter((agency) =>
      agency.name.toLowerCase().includes(normalizedQuery)
    );
  }, [agencies, query]);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-400">Current agency</span>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="flex h-12 w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 text-left text-sm font-medium text-zinc-100 transition hover:border-zinc-700 focus:border-zinc-600 sm:h-14 sm:px-5 sm:text-lg"
        >
          <span className="truncate pr-4">{selectedAgency || 'All agencies'}</span>
          <SelectChevron />
        </button>

        {isOpen && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
            <div className="border-b border-zinc-800 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2">
                <SearchIcon />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search agency..."
                  className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
                  !selectedAgency ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <span>All agencies</span>
              </button>

              <div className="mx-3 my-2 border-t border-zinc-800 pt-2">
                <span className="block px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Individual agencies
                </span>
              </div>

              {filteredAgencies.map((agency) => (
                <button
                  key={agency.name}
                  type="button"
                  onClick={() => {
                    onChange(agency.name);
                    setIsOpen(false);
                  }}
                  className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                    selectedAgency === agency.name ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <span className="truncate pr-4">{agency.name}</span>
                  <span className={`${selectedAgency === agency.name ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    {agency.count.toLocaleString()}
                  </span>
                </button>
              ))}

              {filteredAgencies.length === 0 && (
                <div className="px-3 py-4 text-sm text-zinc-500">No agencies found.</div>
              )}
            </div>
          </div>
        )}
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
      startNavigationFeedback();
      router.push(query ? `/leaderboard?${query}` : '/leaderboard');
    });
  }

  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[220px_minmax(0,1.25fr)_1fr_1fr] ${isPending ? 'opacity-80' : ''}`}>
      <FilterSelect
        label="Year"
        value={String(selectedYear)}
        onChange={(value) => {
          posthog.capture('leaderboard_filter_applied', { filter: 'year', value });
          updateParams({ year: value });
        }}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </FilterSelect>

      <AgencyCombobox
        agencies={agencies}
        selectedAgency={selectedAgency}
        onChange={(value) => {
          posthog.capture('leaderboard_filter_applied', { filter: 'agency', value: value ?? null });
          updateParams({ agency: value || undefined });
        }}
      />

      <FilterSelect
        label="Property Type"
        value={selectedPropertyType || ''}
        onChange={(value) => {
          posthog.capture('leaderboard_filter_applied', { filter: 'property_type', value: value || null });
          updateParams({ propertyType: value || undefined });
        }}
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
        onChange={(value) => {
          posthog.capture('leaderboard_filter_applied', { filter: 'transaction_type', value: value || null });
          updateParams({ transactionType: value || undefined });
        }}
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
