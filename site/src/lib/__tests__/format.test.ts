import {
  formatCount,
  formatDateLabel,
  formatLabel,
  slugifySegment,
} from '@/lib/format';

describe('format helpers', () => {
  it('slugifies human-readable segments for URLs', () => {
    expect(slugifySegment('ERA Realty Network Pte Ltd')).toBe('era-realty-network-pte-ltd');
    expect(slugifySegment('HDB & Condo')).toBe('hdb-and-condo');
  });

  it('formats enum-style labels for display', () => {
    expect(formatLabel('NEW_SALE')).toBe('New Sale');
    expect(formatLabel('private_residential')).toBe('Private Residential');
  });

  it('formats ISO and bucket-style dates', () => {
    expect(formatDateLabel('2026-04-13')).toBe('13 Apr 2026');
    expect(formatDateLabel('MAR-2026')).toBe('Mar 2026');
  });

  it('formats numbers in Singapore-friendly grouped form', () => {
    expect(formatCount(1234567)).toBe('1,234,567');
  });
});
