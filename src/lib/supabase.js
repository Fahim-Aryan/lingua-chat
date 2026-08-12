import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase client — Auth, DB, Realtime, Storage.
 * If env vars are missing the app still boots in demo mode (see App.jsx).
 */
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: true },
      })
    : null;

export const isConfigured = Boolean(supabase);
