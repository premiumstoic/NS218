import { NextResponse } from "next/server";
import { ACCEPTED_UPLOAD_MIME_TYPES } from "@/lib/constants";
import { apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();
    if (auth.error) {
      return auth.error;
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const weekId = formData.get("week_id");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 422 });
    }

    if (!weekId || typeof weekId !== "string") {
      return NextResponse.json({ error: "week_id is required" }, { status: 422 });
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 422 });
    }

    if (!ACCEPTED_UPLOAD_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported MIME type: ${file.type}` }, { status: 422 });
    }

    const sanitized = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const path = `week-${weekId}/${auth.user.id}/${Date.now()}-${sanitized}`;

    const { error: uploadError } = await auth.supabase.storage.from("course-files").upload(path, file, {
      contentType: file.type,
      upsert: false
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = auth.supabase.storage.from("course-files").getPublicUrl(path);

    const { data: uploadRow, error: insertError } = await auth.supabase
      .from("uploads")
      .insert({
        week_id: weekId,
        uploader_id: auth.profile.id,
        title,
        file_url: publicUrlData.publicUrl,
        mime_type: file.type,
        status: "published"
      })
      .select("*")
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ upload: uploadRow }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
