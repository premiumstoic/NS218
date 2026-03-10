import { requireTeacher } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WeekEditorForm } from "@/components/forms/week-editor-form";
import { ContentEditorForm, type ContentEditorWeekOption } from "@/components/forms/content-editor-form";
import { WeekEditForm, type EditableWeek } from "@/components/forms/week-edit-form";
import { ContentEditForm, type EditableContent } from "@/components/forms/content-edit-form";
import { UploadStatusToggle } from "@/components/forms/upload-status-toggle";
import type { UploadStatus } from "@/lib/types";

export default async function TeacherDashboardPage() {
  await requireTeacher();

  const supabase = await createSupabaseServerClient();
  const [{ data: weeks }, { data: content }, { data: uploads }] = await Promise.all([
    supabase.from("weeks").select("*").order("week_index", { ascending: true }),
    supabase
      .from("content_items")
      .select("id,type,title,body,published_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase.from("uploads").select("id,title,status,created_at").order("created_at", { ascending: false }).limit(20)
  ]);

  const activeWeeks = ((weeks ?? []) as Array<Record<string, unknown>>).filter((week) => !week.archived_at);

  const weekOptions: ContentEditorWeekOption[] = activeWeeks.map((week) => ({
    id: String(week.id),
    week_index: Number(week.week_index),
    title: String(week.title)
  }));

  const editableWeeks: EditableWeek[] = ((weeks ?? []) as Array<Record<string, unknown>>).map((week) => ({
    id: String(week.id),
    week_index: Number(week.week_index),
    title: String(week.title),
    act: week.act ? String(week.act) : null,
    start_date: String(week.start_date),
    published: Boolean(week.published),
    is_exam_week: Boolean(week.is_exam_week),
    archived_at: week.archived_at ? String(week.archived_at) : null
  }));

  const editableContent: EditableContent[] = ((content ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id),
    type: String(item.type) as EditableContent["type"],
    title: String(item.title),
    body: item.body ? String(item.body) : null,
    published_at: item.published_at ? String(item.published_at) : null
  }));

  return (
    <div className="grid">
      <section className="card">
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Teacher Dashboard
        </h1>
        <p className="subtle">Manage weekly modules, content publishing, and upload moderation.</p>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        <WeekEditorForm />
        <ContentEditorForm weeks={weekOptions} />
      </section>

      <section className="card">
        <h2 className="section-title">Week Manager</h2>
        <p className="subtle">Archive hides a week from public/student pages. Restore makes it visible again.</p>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
          {editableWeeks.map((week) => (
            <WeekEditForm key={week.id} week={week} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Content Editor</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
          {editableContent.map((item) => (
            <ContentEditForm key={item.id} content={item} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Upload Moderation</h2>
        <div className="grid">
          {(uploads ?? []).map((upload) => (
            <article key={upload.id} className="card" style={{ background: "var(--surface-soft)" }}>
              <div className="row">
                <div>
                  <strong>{upload.title}</strong>
                  <p className="subtle" style={{ marginBottom: 0 }}>
                    {upload.status} | {new Date(upload.created_at).toLocaleString()}
                  </p>
                </div>
                <UploadStatusToggle uploadId={upload.id} initialStatus={upload.status as UploadStatus} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
