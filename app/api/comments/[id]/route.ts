import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await requireApiProfile();
    if (auth.error) {
      return auth.error;
    }

    const { error } = await auth.supabase.from("comments").delete().eq("id", id);
    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
