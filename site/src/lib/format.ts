export function formatCount(value: number): string {
  return value.toLocaleString('en-SG');
}

const UPPERCASE_WORDS = new Set(['hdb', 'ec', 'dbss', 'cea', 'cbd', 'mrt', 'cck', 'ntu', 'nus', 'smu']);

export function formatLabel(value: string | null | undefined): string {
  if (!value) return '—';

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => {
      if (UPPERCASE_WORDS.has(part.toLowerCase())) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

export function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function formatDateLabel(value: string | null | undefined): string {
  if (!value) return '—';

  const monthYearMatch = value.match(/^([A-Z]{3})-(\d{4})$/i);
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch;
    return `${month.charAt(0).toUpperCase()}${month.slice(1).toLowerCase()} ${year}`;
  }

  const isoMonthMatch = value.match(/^(\d{4})-(\d{2})$/);
  if (isoMonthMatch) {
    const parsed = new Date(`${value}-01T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-SG', {
        month: 'short',
        year: 'numeric',
      });
    }
  }

  if (/^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return value;
}
