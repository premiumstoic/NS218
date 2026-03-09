import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await requireApiProfile();
    if (auth.error) {
      return auth.error;
    }

    const { data, error } = await auth.supabase
      .from("quiz_attempts")
      .select("*")
      .eq("content_item_id", id)
      .eq("user_id", auth.profile.id)
      .order("submitted_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ attempts: data ?? [] });
  } catch (error) {
    return apiError(error);
  }
}
