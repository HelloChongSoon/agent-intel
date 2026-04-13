import {
  getCanonicalHost,
  getVariantForHost,
  isRootShellPath,
  normalizeHost,
} from '@/lib/hosts';

describe('host helpers', () => {
  it('normalizes forwarded hosts with ports and casing', () => {
    expect(normalizeHost('Intel.PropNext.sg:3000')).toBe('intel.propnext.sg');
  });

  it('maps the root host to the root variant', () => {
    expect(getVariantForHost('propnext.sg')).toBe('root');
    expect(getVariantForHost('www.propnext.sg')).toBe('root');
  });

  it('maps cats hosts to the cats variant', () => {
    expect(getVariantForHost('cats.propnext.sg')).toBe('cats');
  });

  it('defaults unknown hosts to the intel variant', () => {
    expect(getVariantForHost('intel.propnext.sg')).toBe('intel');
    expect(getVariantForHost('localhost')).toBe('intel');
  });

  it('returns canonical hosts for each variant', () => {
    expect(getCanonicalHost('root')).toBe('propnext.sg');
    expect(getCanonicalHost('intel')).toBe('intel.propnext.sg');
    expect(getCanonicalHost('cats')).toBe('cats.propnext.sg');
  });

  it('allows only the planned shell routes on the root domain', () => {
    expect(isRootShellPath('/')).toBe(true);
    expect(isRootShellPath('/about')).toBe(true);
    expect(isRootShellPath('/products/intel')).toBe(true);
    expect(isRootShellPath('/leaderboard')).toBe(false);
    expect(isRootShellPath('/agent/R000001A')).toBe(false);
  });
});
