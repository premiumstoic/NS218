import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { CommentSection } from "@/components/discussion/comment-section";
import { getCurrentProfile } from "@/lib/auth";
import { getThemeCardStyle } from "@/lib/theme";
import { ProgressBar } from "@/components/progress/progress-bar";

const CONTENT_TYPE_ICONS: Record<string, string> = {
  note: "📄",
  flashcards: "🃏",
  quiz: "📝",
  simulation: "🔬",
  resource: "🔗",
};

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
      .order("created_at", { ascending: false }),
  ]);

  if (!week) {
    notFound();
  }

  let completedCount = 0;
  const totalCount = content?.length ?? 0;

  if (currentProfile && currentProfile.role === "student" && content) {
    const contentIds = content.map((c) => c.id);
    const { data: completedItems } = await supabase
      .from("student_progress")
      .select("id")
      .eq("user_id", currentProfile.id)
      .in("content_item_id", contentIds);
    completedCount = completedItems?.length ?? 0;
  }

  const uploadThemeByUserId = new Map<string, string>();
  if (currentProfile && uploads && uploads.length > 0) {
    const uploaderIds = [...new Set(uploads.map((u) => u.uploader_id))];
    const { data: uploaderProfiles } = await supabase.from("profiles").select("id,theme_token").in("id", uploaderIds);
    uploaderProfiles?.forEach((p) => uploadThemeByUserId.set(p.id, p.theme_token ?? "sage"));
  }

  const formattedDate = week.start_date
    ? new Date(week.start_date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="student-page">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/weeks">Weeks</Link>
        <span className="breadcrumb__sep">›</span>
        <span>Week {week.week_index}</span>
      </nav>

      {/* Hero */}
      <header className="week-hero">
        <div className="week-hero__meta">
          <span className="badge">Week {week.week_index}</span>
          {week.act && <span className="subtle">{week.act}</span>}
          {week.is_exam_week && <span className="badge">Exam Week</span>}
        </div>
        <h1 className="week-hero__title">{week.title}</h1>
        {formattedDate && <p className="subtle" style={{ margin: 0 }}>{formattedDate}</p>}

        {currentProfile?.role === "student" && totalCount > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <ProgressBar completedCount={completedCount} totalCount={totalCount} />
          </div>
        )}
      </header>

      {/* Content list */}
      <section className="card">
        <h2 className="section-title">Content</h2>
        {(content ?? []).length === 0 ? (
          <p className="subtle">No content yet.</p>
        ) : (
          <div className="content-list">
            {(content ?? []).map((item) => (
              <Link key={item.id} href={`/content/${item.id}`} className="content-list-item">
                <span className="content-list-item__icon" aria-hidden="true">
                  {CONTENT_TYPE_ICONS[item.type] ?? "📄"}
                </span>
                <div className="content-list-item__info">
                  <span className="content-list-item__title">{item.title}</span>
                  <span className="subtle">{CONTENT_TYPE_LABELS[item.type as keyof typeof CONTENT_TYPE_LABELS]}</span>
                </div>
                <span className="content-list-item__arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Uploads */}
      {(uploads ?? []).length > 0 && (
        <section className="card">
          <h2 className="section-title">Student Uploads</h2>
          <div className="content-list">
            {(uploads ?? []).map((upload) => (
              <Link
                key={upload.id}
                href={`/uploads/${upload.id}`}
                className="content-list-item"
                style={getThemeCardStyle(uploadThemeByUserId.get(upload.uploader_id))}
              >
                <span className="content-list-item__icon" aria-hidden="true">📎</span>
                <div className="content-list-item__info">
                  <span className="content-list-item__title">{upload.title}</span>
                  <span className="subtle">{new Date(upload.created_at).toLocaleDateString()}</span>
                </div>
                <span className="content-list-item__arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <CommentSection targetType="week" targetId={week.id} />
    </div>
  );
}
