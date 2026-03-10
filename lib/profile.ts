import { getTeacherEmailSet } from "@/lib/env";

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

type ProfileRecord = {
  id: string;
  email: string;
  display_name: string | null;
  role: "teacher" | "student";
  avatar_url?: string | null;
  theme_token?: "sage" | "ocean" | "amber" | "rose" | "slate";
};

type QueryError = { message: string } | null;

type QueryResult<T> = Promise<{ data: T | null; error: QueryError }>;

export interface MinimalSupabaseClient {
  from: (table: string) => {
    upsert: (values: Record<string, unknown>, options: { onConflict: string }) => {
      select: (columns: string) => {
        single: () => QueryResult<ProfileRecord>;
      };
    };
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        maybeSingle: () => QueryResult<ProfileRecord>;
      };
    };
  };
}

export async function ensureProfileForUser(supabase: MinimalSupabaseClient, user: AuthUser) {
  if (!user.email) {
    return null;
  }

  const fallbackDisplayName = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email;
  const fallbackAvatarUrl = user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;

  const existingProfile = await getProfileByUserId(supabase, user.id);
  const teacherEmails = getTeacherEmailSet();
  const role = teacherEmails.has(user.email.toLowerCase()) ? "teacher" : "student";

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        display_name: existingProfile ? (existingProfile.display_name ?? fallbackDisplayName) : fallbackDisplayName,
        avatar_url: existingProfile ? (existingProfile.avatar_url ?? null) : fallbackAvatarUrl,
        theme_token: existingProfile ? (existingProfile.theme_token ?? "sage") : "sage",
        role
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getProfileByUserId(supabase: MinimalSupabaseClient, userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}
