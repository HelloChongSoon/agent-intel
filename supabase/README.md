# Supabase Workflow

This repo now supports Supabase CLI-style migrations.

## One-time setup

1. Install the Supabase CLI on your machine.
2. Log in:

```bash
supabase login
```

3. Link this repo to your hosted project:

```bash
supabase link --project-ref marzrqooukajfgovotse
```

## Common commands

Create a new migration:

```bash
npm run supabase:migration:new -- your_migration_name
```

Apply local migrations to the linked remote project:

```bash
npm run supabase:push
```

Pull remote schema changes into a migration:

```bash
npm run supabase:pull
```

Start local Supabase services:

```bash
npm run supabase:start
```

Stop local Supabase services:

```bash
npm run supabase:stop
```

## Current state

The first tracked migration is:

- `supabase/migrations/20260409120000_leaderboard_and_filters.sql`

Existing SQL files under `scripts/` are still kept for reference, but future database changes should go through `supabase/migrations/`.
