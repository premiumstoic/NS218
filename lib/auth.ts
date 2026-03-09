import { redirect } from "next/navigation";
import { getTeacherEmailSet } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  if (!user?.email) {
    return null;
  }

  const isTeacher = getTeacherEmailSet().has(user.email.toLowerCase());

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.display_name ?? user.email,
        role: isTeacher ? "teacher" : "student"
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
