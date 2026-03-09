import { createClient } from "@supabase/supabase-js";
import { getEnv, getOptionalEnv } from "@/lib/env";

export function createSupabaseServiceClient() {
  const serviceKey = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(getEnv("NEXT_PUBLIC_SUPABASE_URL"), serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
