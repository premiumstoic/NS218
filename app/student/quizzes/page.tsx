import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StudentQuizzesPage() {
  const profile = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("id,score,submitted_at,content_item_id")
    .eq("user_id", profile.id)
    .order("submitted_at", { ascending: false });

  return (
    <div className="grid">
      <section className="card">
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Quiz History
        </h1>
        <p className="subtle">Unlimited practice attempts are stored here.</p>
      </section>

      <section className="card">
        {(attempts ?? []).length === 0 ? <p className="subtle">No attempts yet.</p> : null}
        <div className="grid">
          {(attempts ?? []).map((attempt) => (
            <article key={attempt.id} className="card" style={{ background: "var(--surface-soft)" }}>
              <p>
                <strong>{attempt.score}%</strong>
              </p>
              <p className="subtle">{new Date(attempt.submitted_at).toLocaleString()}</p>
              <Link className="button secondary" href={`/content/${attempt.content_item_id}`}>
                Open quiz
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
