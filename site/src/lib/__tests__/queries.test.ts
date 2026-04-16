import { __private__ } from '@/lib/queries';

describe('query mapping helpers', () => {
  it('parses counted property-type lists from RPC json payloads', () => {
    expect(
      __private__.parseCountList(
        [
          { property_type: 'CONDOMINIUM_APARTMENTS', count: 12 },
          { property_type: 'HDB', count: '5' },
          { property_type: '', count: 3 },
        ],
        'property_type'
      )
    ).toEqual([
      { value: 'CONDOMINIUM_APARTMENTS', count: 12 },
      { value: 'HDB', count: 5 },
    ]);
  });

  it('parses movement insights payloads into app-safe shapes', () => {
    expect(
      __private__.parseMovementBreakdown([
        {
          week_start: '2026-04-13',
          counts: { agency_change: 4, new_registration: '2' },
          total: '6',
        },
      ])
    ).toEqual([
      {
        weekStart: '2026-04-13',
        counts: { agency_change: 4, new_registration: 2 },
        total: 6,
      },
    ]);

    expect(
      __private__.parseAgencyNetChange([
        { agency: 'ERA REALTY NETWORK PTE LTD', gained: '8', lost: 3, net: '5' },
      ])
    ).toEqual([
      { agency: 'ERA REALTY NETWORK PTE LTD', gained: 8, lost: 3, net: 5 },
    ]);
  });
});
