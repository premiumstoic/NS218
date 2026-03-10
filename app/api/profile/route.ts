import { NextResponse } from "next/server";
import { apiError, parseJsonBody } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";
import { profilePatchSchema } from "@/lib/validators/api";

export async function PATCH(request: Request) {
  try {
    const auth = await requireApiProfile();
    if (auth.error) {
      return auth.error;
    }

    const payload = await parseJsonBody(request, profilePatchSchema);

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No profile fields provided" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("profiles")
      .update(payload)
      .eq("id", auth.profile.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    return apiError(error);
  }
}
