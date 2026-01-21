// Shared Auth Supabase Client (hardcoded credentials)
// This client is used ONLY for authentication via the shared Supabase instance

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://api.srv936332.hstgr.cloud';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const APP_SLUG = 'habit-time-insights';

let authClient: SupabaseClient | null = null;

export function getAuthClient(): SupabaseClient {
  if (!authClient) {
    authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return authClient;
}

export async function signInWithGoogle(): Promise<void> {
  const client = getAuthClient();
  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : undefined;

  await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
}

export async function signOut(): Promise<void> {
  const client = getAuthClient();
  await client.auth.signOut();
}

export async function getCurrentUser() {
  const client = getAuthClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function trackUserLogin(userId: string, email: string): Promise<void> {
  const client = getAuthClient();

  try {
    // Upsert into user_tracking table
    const { error } = await client
      .from('user_tracking')
      .upsert(
        {
          user_id: userId,
          email: email,
          app: APP_SLUG,
          login_cnt: 1,
          last_login_ts: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,app',
        }
      );

    if (error) {
      // Try incrementing if upsert failed due to existing row
      const { error: updateError } = await client.rpc('increment_login', {
        p_user_id: userId,
        p_app: APP_SLUG,
      });

      if (updateError) {
        // Fallback: manual update
        await client
          .from('user_tracking')
          .update({
            login_cnt: client.rpc('increment_field', { field: 'login_cnt' }),
            last_login_ts: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('app', APP_SLUG);
      }
    }
  } catch (e) {
    console.error('Error tracking user login:', e);
  }
}

export function onAuthStateChange(callback: (user: any) => void) {
  const client = getAuthClient();
  return client.auth.onAuthStateChange((event, session) => {
    const user = session?.user || null;

    // Set global auth user for other components
    if (typeof window !== 'undefined') {
      (window as any).AUTH_USER = user;
      window.dispatchEvent(new CustomEvent('auth:user', { detail: user }));
    }

    // Track login on SIGNED_IN event
    if (event === 'SIGNED_IN' && user) {
      trackUserLogin(user.id, user.email || '');
    }

    callback(user);
  });
}

export { APP_SLUG };
