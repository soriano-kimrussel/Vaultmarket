import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

let client: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (!client) client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
