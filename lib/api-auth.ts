import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfileForUser, type AuthUser, type MinimalSupabaseClient } from "@/lib/profile";

export async function requireApiProfile(options?: { teacherOnly?: boolean }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  const profile = await ensureProfileForUser(
    supabase as unknown as MinimalSupabaseClient,
    data.user as unknown as AuthUser
  );

  if (!profile) {
    return {
      error: NextResponse.json({ error: "Profile could not be established" }, { status: 403 })
    };
  }

  if (options?.teacherOnly && profile.role !== "teacher") {
    return {
      error: NextResponse.json({ error: "Teacher role required" }, { status: 403 })
    };
  }

  return { supabase, user: data.user, profile };
}
