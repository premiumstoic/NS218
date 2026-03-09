import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CommentSection } from "@/components/discussion/comment-section";

function canInlinePreview(mimeType: string) {
  return ["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(mimeType);
}

export default async function UploadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: upload } = await supabase
    .from("uploads")
    .select("id,title,mime_type,file_url,created_at")
    .eq("id", id)
    .maybeSingle();

  if (!upload) {
    notFound();
  }

  return (
    <div className="grid">
      <section className="card">
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          {upload.title}
        </h1>
        <p className="subtle">{upload.mime_type}</p>
        <a className="button secondary" href={upload.file_url}>
          Download / Open file
        </a>
      </section>

      {canInlinePreview(upload.mime_type) ? (
        <section className="card" style={{ minHeight: "480px" }}>
          <iframe title="Upload preview" src={upload.file_url} style={{ border: 0, width: "100%", minHeight: "480px" }} />
        </section>
      ) : (
        <section className="card">
          <p className="subtle">Inline preview is available for PDF/images only.</p>
        </section>
      )}

      <CommentSection targetType="upload" targetId={upload.id} />
    </div>
  );
}
