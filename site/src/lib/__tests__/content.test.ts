import { getGuideBySlug, guides } from '@/lib/content';

describe('guide content', () => {
  it('contains the planned launch guide set', () => {
    expect(guides.map((guide) => guide.slug)).toEqual([
      'how-to-choose-a-property-agent-in-singapore',
      'how-to-read-property-agent-transaction-history',
      'top-condo-agents-vs-top-hdb-agents',
      'what-agent-movements-mean-for-buyers-and-sellers',
      'how-to-verify-a-property-agent-in-singapore',
    ]);
  });

  it('returns guides by slug', () => {
    expect(getGuideBySlug('how-to-verify-a-property-agent-in-singapore')?.title).toBe(
      'How To Verify a Property Agent in Singapore'
    );
    expect(getGuideBySlug('missing-guide')).toBeNull();
  });

  it('keeps all guides answer-first and FAQ-backed', () => {
    for (const guide of guides) {
      expect(guide.directAnswer.length).toBeGreaterThan(40);
      expect(guide.takeaways.length).toBeGreaterThanOrEqual(3);
      expect(guide.faq.length).toBeGreaterThanOrEqual(2);
    }
  });
});
