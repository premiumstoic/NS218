import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfileForUser, type AuthUser, type MinimalSupabaseClient } from "@/lib/profile";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function syncProfileForCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return null;
  }

  return ensureProfileForUser(supabase as unknown as MinimalSupabaseClient, user as unknown as AuthUser);
}

export async function getCurrentProfile() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  await syncProfileForCurrentUser();

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

export async function requireAuth() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}

export async function requireTeacher() {
  const profile = await requireAuth();
  if (profile.role !== "teacher") {
    redirect("/");
  }

  return profile;
}
