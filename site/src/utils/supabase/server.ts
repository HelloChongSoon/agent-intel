import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseKey);

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  if (!hasSupabaseEnv) {
    return null;
  }

  try {
    return createServerClient(
      supabaseUrl!,
      supabaseKey!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore cookie writes from Server Components.
            }
          },
        },
      }
    );
  } catch (error) {
    console.error('Failed to create Supabase server client:', error);
    return null;
  }
};
