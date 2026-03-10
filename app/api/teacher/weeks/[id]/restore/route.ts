import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await requireApiProfile({ teacherOnly: true });
    if (auth.error) {
      return auth.error;
    }

    const { data, error } = await auth.supabase
      .from("weeks")
      .update({
        archived_at: null,
        archived_by: null
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ week: data });
  } catch (error) {
    return apiError(error);
  }
}
