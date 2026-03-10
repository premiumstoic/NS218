import { NextResponse } from "next/server";
import { parseJsonBody, apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";
import { weekPatchSchema } from "@/lib/validators/api";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await requireApiProfile({ teacherOnly: true });
    if (auth.error) {
      return auth.error;
    }

    const payload = await parseJsonBody(request, weekPatchSchema);

    const { data, error } = await auth.supabase
      .from("weeks")
      .update(payload)
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

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await requireApiProfile({ teacherOnly: true });
    if (auth.error) {
      return auth.error;
    }

    const { data, error } = await auth.supabase
      .from("weeks")
      .update({
        archived_at: new Date().toISOString(),
        archived_by: auth.profile.id
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
