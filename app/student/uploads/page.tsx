import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UploadForm, type UploadWeekOption } from "@/components/forms/upload-form";

export default async function StudentUploadsPage() {
  const profile = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const [{ data: weeks }, { data: ownUploads }] = await Promise.all([
    supabase.from("weeks").select("id,week_index,title").eq("published", true).order("week_index", { ascending: true }),
    supabase
      .from("uploads")
      .select("id,title,mime_type,file_url,created_at")
      .eq("uploader_id", profile.id)
      .order("created_at", { ascending: false })
  ]);

  const weekOptions: UploadWeekOption[] = ((weeks ?? []) as Array<Record<string, unknown>>).map((week) => ({
    id: String(week.id),
    week_index: Number(week.week_index),
    title: String(week.title)
  }));

  return (
    <div className="grid">
      <section className="card">
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Upload Center
        </h1>
        <p className="subtle">Share weekly notes, screenshots, and documents with the class.</p>
      </section>

      <UploadForm weeks={weekOptions} />

      <section className="card">
        <h2 className="section-title">My Uploads</h2>
        {(ownUploads ?? []).length === 0 ? <p className="subtle">No uploads yet.</p> : null}
        <div className="grid">
          {(ownUploads ?? []).map((upload) => (
            <article key={upload.id} className="card" style={{ background: "var(--surface-soft)" }}>
              <p>
                <strong>{upload.title}</strong>
              </p>
              <p className="subtle">{upload.mime_type}</p>
              <a className="button secondary" href={`/uploads/${upload.id}`}>
                Open
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
