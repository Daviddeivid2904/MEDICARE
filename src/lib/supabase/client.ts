import { createBrowserClient } from "@supabase/ssr";

const fallbackSupabaseUrl = "https://gjncbofcmalgmrqtdpaj.supabase.co";
const fallbackSupabasePublishableKey =
  "sb_publishable_XPidDjre2nYrcWdjjB3tqQ_1yMd_ks1";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? fallbackSupabaseUrl;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? fallbackSupabasePublishableKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
