import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StudentActivityPage() {
  const profile = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const [{ data: comments }, { data: uploads }, { data: attempts }] = await Promise.all([
    supabase.from("comments").select("id,body,target_type,target_id,created_at").eq("author_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("uploads").select("id,title,mime_type,created_at").eq("uploader_id", profile.id).order("created_at", { ascending: false }),
    supabase
      .from("quiz_attempts")
      .select("id,content_item_id,score,submitted_at")
      .eq("user_id", profile.id)
      .order("submitted_at", { ascending: false })
  ]);

  return (
    <div className="grid">
      <section className="card">
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          My Activity
        </h1>
      </section>

      <section className="card">
        <h2 className="section-title">Recent comments</h2>
        {(comments ?? []).length === 0 ? <p className="subtle">No comments yet.</p> : null}
        <ul>
          {(comments ?? []).map((comment) => (
            <li key={comment.id}>
              [{new Date(comment.created_at).toLocaleString()}] {comment.body.slice(0, 120)}{" "}
              <Link href={comment.target_type === "content_item" ? `/content/${comment.target_id}` : comment.target_type === "week" ? `/weeks/${comment.target_id}` : `/uploads/${comment.target_id}`}>
                Open target
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="section-title">Recent uploads</h2>
        {(uploads ?? []).length === 0 ? <p className="subtle">No uploads yet.</p> : null}
        <ul>
          {(uploads ?? []).map((upload) => (
            <li key={upload.id}>
              [{new Date(upload.created_at).toLocaleString()}] {upload.title} ({upload.mime_type})
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="section-title">Quiz attempts</h2>
        {(attempts ?? []).length === 0 ? <p className="subtle">No attempts yet.</p> : null}
        <ul>
          {(attempts ?? []).map((attempt) => (
            <li key={attempt.id}>
              [{new Date(attempt.submitted_at).toLocaleString()}] {attempt.score}% -{" "}
              <Link href={`/content/${attempt.content_item_id}`}>Open quiz</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
