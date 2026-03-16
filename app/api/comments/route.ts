import { NextResponse } from "next/server";
import { parseJsonBody, apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";
import { commentCreateSchema } from "@/lib/validators/api";
import { notifyCommentReply } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();
    if (auth.error) {
      return auth.error;
    }

    const payload = await parseJsonBody(request, commentCreateSchema);

    const { data, error } = await auth.supabase
      .from("comments")
      .insert({
        ...payload,
        author_id: auth.profile.id
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    // Notify other users who commented on the same target
    const { data: otherComments } = await auth.supabase
      .from("comments")
      .select("author_id")
      .eq("target_type", payload.target_type)
      .eq("target_id", payload.target_id)
      .neq("author_id", auth.profile.id);

    if (otherComments && otherComments.length > 0) {
      // Get unique user IDs
      const uniqueUserIds = [...new Set(otherComments.map((c) => c.author_id))];

      // Notify each user
      for (const userId of uniqueUserIds) {
        await notifyCommentReply(
          userId,
          auth.profile.display_name || auth.profile.email || "Someone",
          payload.target_type,
          payload.target_id
        );
      }
    }

    return NextResponse.json(
      {
        comment: {
          ...data,
          profiles: {
            display_name: auth.profile.display_name ?? null,
            email: auth.profile.email ?? null,
            theme_token: auth.profile.theme_token ?? "sage",
            avatar_url: auth.profile.avatar_url ?? null
          }
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
