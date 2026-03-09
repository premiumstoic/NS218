import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { CommentSectionClient } from "@/components/discussion/comment-section-client";

interface CommentSectionProps {
  targetType: "week" | "content_item" | "upload";
  targetId: string;
}

type BaseComment = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};

type CommentWithProfile = BaseComment & {
  profiles?: {
    id: string;
    display_name: string | null;
    email: string | null;
  } | null;
};

export async function CommentSection({ targetType, targetId }: CommentSectionProps) {
  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentProfile();

  const { data: comments } = await supabase
    .from("comments")
    .select("id,author_id,body,created_at")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: true });

  let mergedComments: CommentWithProfile[] = (comments ?? []) as CommentWithProfile[];

  if (profile && comments && comments.length > 0) {
    const authorIds = [...new Set(comments.map((comment) => comment.author_id))];
    const { data: profiles } = await supabase.from("profiles").select("id,display_name,email").in("id", authorIds);

    const byId = new Map((profiles ?? []).map((entry) => [entry.id, entry]));
    mergedComments = comments.map((comment) => ({
      ...comment,
      profiles: byId.get(comment.author_id) ?? null
    }));
  }

  return (
    <CommentSectionClient
      targetType={targetType}
      targetId={targetId}
      initialComments={mergedComments}
      currentUserId={profile?.id}
      isTeacher={profile?.role === "teacher"}
    />
  );
}
