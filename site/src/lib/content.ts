export interface GuideContent {
  slug: string;
  title: string;
  description: string;
  directAnswer: string;
  takeaways: string[];
  sections: Array<{
    heading: string;
    body: string[];
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
}

export const guides: GuideContent[] = [
  {
    slug: 'how-to-choose-a-property-agent-in-singapore',
    title: 'How To Choose a Property Agent in Singapore',
    description: 'A consumer-first framework for evaluating Singapore property agents using transaction history, specialization, and consistency.',
    directAnswer:
      'Choose a property agent in Singapore by checking whether they are active in your property type, current in the last 12 months, and consistent in the areas and deal types that match your goal.',
    takeaways: [
      'Recent activity matters more than lifetime volume alone.',
      'A condo specialist and an HDB specialist can look equally strong for different needs.',
      'Agency brand helps, but individual transaction history is more useful.',
      'Consumers should compare role mix, property mix, and latest activity before contacting an agent.',
    ],
    sections: [
      {
        heading: 'What this means',
        body: [
          'The best agent for one buyer is not automatically the best agent for every buyer. A consumer-focused comparison should start with the property type, transaction type, and area you care about.',
          'An agent with current activity in the same segment is usually easier to trust than a profile with older or broader but less relevant records.',
        ],
      },
      {
        heading: 'How to evaluate an agent profile',
        body: [
          'Check whether the agent is still active based on their latest transaction date.',
          'Look at their property mix and role mix to see whether they mainly work with buyers, sellers, landlords, or tenants.',
          'Use comparable agents from the same agency or specialization to avoid relying on brand alone.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is the biggest agent always the best choice?',
        answer: 'No. The better choice is the agent with relevant recent activity in your exact deal type and market segment.',
      },
      {
        question: 'Should I choose by agency or by individual agent?',
        answer: 'Start with the individual agent, then use the agency as a secondary trust signal.',
      },
    ],
  },
  {
    slug: 'how-to-read-property-agent-transaction-history',
    title: 'How To Read Property Agent Transaction History',
    description: 'Understand what transaction counts, property mix, and recent activity say about a Singapore property agent profile.',
    directAnswer:
      'A property agent transaction history shows how active an agent is, what property segments they work in, and whether their recent record matches the type of transaction you need help with.',
    takeaways: [
      'Transaction counts should be read together with recency.',
      'Property mix reveals true specialization.',
      'Role mix helps buyers and sellers find agents with relevant experience.',
      'A profile is more useful when it clearly explains how the data is calculated.',
    ],
    sections: [
      {
        heading: 'What this means',
        body: [
          'Consumers often see a large total number and assume it represents current expertise. A better reading combines total records with latest activity and specialization.',
          'If an agent has mostly rental-room transactions, that may not be the right fit for a condo resale seller.',
        ],
      },
      {
        heading: 'How we calculate this',
        body: [
          'Transaction history is grouped into property type, deal type, role, and recency so users can compare agents on relevant signals instead of one raw volume number.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does more transactions always mean better service?',
        answer: 'No. More transactions can indicate experience, but consumers should still evaluate relevance and recency.',
      },
      {
        question: 'What is the most important metric to check first?',
        answer: 'Start with latest activity and property-type fit, then review total transaction volume.',
      },
    ],
  },
  {
    slug: 'top-condo-agents-vs-top-hdb-agents',
    title: 'Top Condo Agents vs Top HDB Agents',
    description: 'Why consumers should compare top condo agents and top HDB agents differently in Singapore.',
    directAnswer:
      'Top condo agents and top HDB agents should be compared separately because the client journey, buyer pool, and deal patterns are different across those segments.',
    takeaways: [
      'Condo and HDB activity often signal different expertise.',
      'Property-type pages help consumers avoid broad rankings that hide specialization.',
      'Recency and role mix still matter inside each segment.',
      'Consumers should compare like-for-like, not all agents at once.',
    ],
    sections: [
      {
        heading: 'What this means',
        body: [
          'An agent who performs strongly in HDB resale may not be the right choice for a luxury condo buyer. Segment-specific rankings help consumers compare agents on the right basis.',
        ],
      },
      {
        heading: 'How to use this comparison',
        body: [
          'Use property-type rankings when your need is specific. Use broad leaderboards only as a starting point.',
        ],
      },
    ],
    faq: [
      {
        question: 'Why not just use one master leaderboard?',
        answer: 'A master leaderboard is useful for discovery, but consumers make better decisions when they compare agents within the relevant property segment.',
      },
      {
        question: 'Can one agent be strong in both condo and HDB?',
        answer: 'Yes, but consumers should still verify whether the recent transaction mix supports that breadth.',
      },
    ],
  },
  {
    slug: 'what-agent-movements-mean-for-buyers-and-sellers',
    title: 'What Agent Movements Mean for Buyers and Sellers',
    description: 'A plain-English guide to agency changes, new registrations, and why agent movement matters to Singapore consumers.',
    directAnswer:
      'Agent movements help buyers and sellers understand whether an agent is newly registered, changing agencies, or returning to the market, which can affect continuity, branding, and support.',
    takeaways: [
      'Agency transfers can change the support structure around an agent.',
      'Movements are best read as context, not as a quality score by themselves.',
      'Consumers should combine movement history with transaction activity.',
      'Recent movement pages are useful for monitoring the market, not just the profession.',
    ],
    sections: [
      {
        heading: 'What this means',
        body: [
          'A movement record does not automatically indicate a positive or negative change. It tells consumers that an agent’s business context may have changed.',
        ],
      },
      {
        heading: 'Latest activity',
        body: [
          'The best way to interpret a movement is to compare it with the agent’s most recent transaction history and current agency page.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does an agency transfer mean the agent is risky?',
        answer: 'No. It simply means the agent changed agencies, which should be read together with their active transaction record.',
      },
      {
        question: 'Why should consumers care about movement data?',
        answer: 'It adds context to who is active, who is stable, and how an agency’s talent pool is shifting over time.',
      },
    ],
  },
  {
    slug: 'how-to-verify-a-property-agent-in-singapore',
    title: 'How To Verify a Property Agent in Singapore',
    description: 'Use CEA number, agency affiliation, registration period, and transaction history to verify a Singapore property agent.',
    directAnswer:
      'To verify a property agent in Singapore, check their CEA number, registration period, current agency, and whether their recent transaction history matches the work they claim to do.',
    takeaways: [
      'CEA number is the fastest identity check.',
      'Registration dates help users confirm active status.',
      'Agency and transaction history add practical context.',
      'Verification is stronger when identity and activity line up together.',
    ],
    sections: [
      {
        heading: 'What this means',
        body: [
          'Consumers should verify both identity and activity. A registered agent is easier to trust when their public record also shows recent work in the relevant segment.',
        ],
      },
      {
        heading: 'How we calculate this',
        body: [
          'PropNext Intel surfaces registration and activity context together so users can check more than a name alone.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is the CEA number enough on its own?',
        answer: 'It is the starting point, but consumers should still review recent activity and current agency context.',
      },
      {
        question: 'What if an agent has no recent visible transactions?',
        answer: 'That does not automatically mean the agent is inactive, but it does mean consumers should ask more questions before deciding.',
      },
    ],
  },
];

export function getGuideBySlug(slug: string) {
  return guides.find((guide) => guide.slug === slug) || null;
}
