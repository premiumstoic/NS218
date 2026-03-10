import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { CommentSection } from "@/components/discussion/comment-section";
import { getCurrentProfile } from "@/lib/auth";
import { getThemeCardStyle } from "@/lib/theme";

export default async function WeekDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const currentProfile = await getCurrentProfile();

  const [{ data: week }, { data: content }, { data: uploads }] = await Promise.all([
    supabase.from("weeks").select("*").eq("id", id).eq("published", true).is("archived_at", null).maybeSingle(),
    supabase
      .from("content_items")
      .select("id,type,title,published_at")
      .eq("week_id", id)
      .not("published_at", "is", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("uploads")
      .select("id,title,mime_type,file_url,created_at,uploader_id")
      .eq("week_id", id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
  ]);

  if (!week) {
    notFound();
  }

  const uploadThemeByUserId = new Map<string, string>();
  if (currentProfile && uploads && uploads.length > 0) {
    const uploaderIds = [...new Set(uploads.map((upload) => upload.uploader_id))];
    const { data: uploaderProfiles } = await supabase.from("profiles").select("id,theme_token").in("id", uploaderIds);
    uploaderProfiles?.forEach((entry) => {
      uploadThemeByUserId.set(entry.id, entry.theme_token ?? "sage");
    });
  }

  return (
    <div className="grid">
      <section className="card">
        <div className="row">
          <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            Week {week.week_index}: {week.title}
          </h1>
          {week.is_exam_week ? <span className="badge">Exam Week</span> : null}
        </div>
        <p className="subtle">
          {week.act ?? "-"} | Starts {week.start_date}
        </p>
      </section>

      <section className="card">
        <h2 className="section-title">Week Content</h2>
        <div className="grid">
          {(content ?? []).length === 0 ? <p className="subtle">No content yet.</p> : null}
          {(content ?? []).map((item) => (
            <article key={item.id} className="card" style={{ background: "var(--surface-soft)" }}>
              <div className="row">
                <strong>{item.title}</strong>
                <span className="badge">{CONTENT_TYPE_LABELS[item.type as keyof typeof CONTENT_TYPE_LABELS]}</span>
              </div>
              <p className="subtle">{item.published_at ? "Published" : "Draft"}</p>
              <Link className="button secondary" href={`/content/${item.id}`}>
                Open
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Student Uploads</h2>
        <div className="grid">
          {(uploads ?? []).length === 0 ? <p className="subtle">No uploads yet.</p> : null}
          {(uploads ?? []).map((upload) => (
            <article
              key={upload.id}
              className="card"
              style={getThemeCardStyle(uploadThemeByUserId.get(upload.uploader_id))}
            >
              <p style={{ marginBottom: "0.35rem" }}>
                <strong>{upload.title}</strong>
              </p>
              <p className="subtle" style={{ marginTop: 0 }}>
                {upload.mime_type}
              </p>
              <Link className="button secondary" href={`/uploads/${upload.id}`}>
                Open upload
              </Link>
            </article>
          ))}
        </div>
      </section>

      <CommentSection targetType="week" targetId={week.id} />
    </div>
  );
}
