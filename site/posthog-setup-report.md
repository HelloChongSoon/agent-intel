<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics for PropNext Intel (Next.js 15, App Router). PostHog is initialized client-side via `instrumentation-client.ts` using the recommended Next.js 15.3+ pattern, with a reverse proxy configured in `next.config.mjs`. Eight events are now instrumented across the core user journey — from agent discovery through to contact intent — covering the leaderboard, search, movements intelligence, and agent profile flows.

| Event | Description | File |
|---|---|---|
| `agent_search_submitted` | User submits an agent search query | `src/components/SearchBar.tsx` |
| `search_result_agent_clicked` | User clicks an agent link in search results | `src/components/SearchResultLink.tsx` |
| `agent_contact_revealed` | User reveals an agent's phone or email — high-intent contact signal | `src/components/RevealContact.tsx` |
| `leaderboard_filter_applied` | User changes a leaderboard filter (year, agency, property type, transaction type) | `src/components/LeaderboardFilters.tsx` |
| `leaderboard_agent_clicked` | User clicks an agent name in the leaderboard table | `src/components/LeaderboardAgentLink.tsx` |
| `movements_searched` | User submits the movements history search form | `src/components/MovementsSearchForm.tsx` |
| `movements_type_filter_applied` | User clicks a movement type filter badge | `src/components/MovementsTypeFilters.tsx` |
| `intel_product_opened` | User clicks "Open PropNext Intel" CTA | `src/components/OpenIntelLink.tsx` |

### Files created or modified

**New components:**
- `src/components/SearchResultLink.tsx` — client component wrapping agent links in search results with `search_result_agent_clicked` capture
- `src/components/LeaderboardAgentLink.tsx` — client component wrapping agent links in the leaderboard table with `leaderboard_agent_clicked` capture
- `src/components/MovementsSearchForm.tsx` — client component replacing the server-rendered form on /movements with `movements_searched` capture
- `src/components/MovementsTypeFilters.tsx` — client component replacing the type filter badges on /movements with `movements_type_filter_applied` capture

**Modified pages:**
- `src/app/search/page.tsx` — replaced agent `<Link>` in results table with `<SearchResultLink>`
- `src/app/leaderboard/page.tsx` — replaced agent `<Link>` in rankings table with `<LeaderboardAgentLink>`
- `src/app/movements/page.tsx` — replaced server-side search form and type filter div with client components

**Infrastructure (already in place):**
- `instrumentation-client.ts` — PostHog client-side init with `/ingest` reverse proxy, exception capture, and debug mode in dev
- `next.config.mjs` — PostHog reverse proxy rewrites and `skipTrailingSlashRedirect: true`
- `.env.local` — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/381174/dashboard/1463897
- **Agent discovery funnel: search → profile → contact**: https://us.posthog.com/project/381174/insights/3YuJAYoO
- **Agent discovery traffic: search vs leaderboard**: https://us.posthog.com/project/381174/insights/d1aUXsVH
- **Contact reveal by type (phone vs email)**: https://us.posthog.com/project/381174/insights/iT60jaFX
- **Leaderboard engagement: filters → agent clicks → contact reveals**: https://us.posthog.com/project/381174/insights/6ygw0kkE
- **Movements page engagement**: https://us.posthog.com/project/381174/insights/zPz6mSHb

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
