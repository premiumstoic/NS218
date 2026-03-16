import { NextResponse } from "next/server";
import { parseJsonBody, apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";
import { weekPatchSchema } from "@/lib/validators/api";
import { notifyAllStudents } from "@/lib/notifications";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await requireApiProfile({ teacherOnly: true });
    if (auth.error) {
      return auth.error;
    }

    const payload = await parseJsonBody(request, weekPatchSchema);

    // Get current week data to check if we're publishing
    const { data: currentWeek } = await auth.supabase
      .from("weeks")
      .select("published")
      .eq("id", id)
      .single();

    const { data, error } = await auth.supabase
      .from("weeks")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    // Notify students if week is being published
    if (currentWeek && !currentWeek.published && data.published) {
      await notifyAllStudents(
        `New week published: Week ${data.week_index} - ${data.title}`,
        `/weeks/${data.id}`
      );
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
