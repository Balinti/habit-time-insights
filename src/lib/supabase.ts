// App-specific Supabase Client (uses env vars)
// This client is used for app data storage (experiments, checkins, metrics, subscriptions)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let appClient: SupabaseClient | null = null;

export function getAppClient(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    // Server-side: create client with service role for admin operations
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return null;
    }

    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // Client-side
  if (!appClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return null;
    }

    appClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return appClient;
}

export function hasAppSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key);
}
