import { NextResponse } from "next/server";
import { apiError, parseJsonBody } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";
import { uploadMetadataCreateSchema } from "@/lib/validators/api";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();
    if (auth.error) {
      return auth.error;
    }

    const payload = await parseJsonBody(request, uploadMetadataCreateSchema);

    const { data: activeWeek, error: weekError } = await auth.supabase
      .from("weeks")
      .select("id")
      .eq("id", payload.week_id)
      .eq("published", true)
      .is("archived_at", null)
      .maybeSingle();

    if (weekError || !activeWeek) {
      return NextResponse.json({ error: "Selected week is not available for uploads" }, { status: 400 });
    }

    const { data: uploadRow, error: insertError } = await auth.supabase
      .from("uploads")
      .insert({
        week_id: payload.week_id,
        uploader_id: auth.profile.id,
        title: payload.title,
        file_url: payload.file_url,
        mime_type: payload.mime_type,
        status: "published"
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: `Failed to save upload metadata: ${insertError.message}` }, { status: 400 });
    }

    return NextResponse.json({ upload: uploadRow }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
