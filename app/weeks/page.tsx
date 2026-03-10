import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function WeeksPage() {
  const supabase = await createSupabaseServerClient();
  const { data: weeks } = await supabase
    .from("weeks")
    .select("*")
    .eq("published", true)
    .is("archived_at", null)
    .order("week_index", { ascending: true });

  return (
    <div className="grid">
      <section className="card">
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Weekly Modules
        </h1>
        <p className="subtle">Each week bundles notes, flashcards, quizzes, simulations, resources, uploads, and discussion.</p>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
        {(weeks ?? []).map((week) => (
          <article key={week.id} className="card">
            <div className="row">
              <strong>Week {week.week_index}</strong>
              {week.is_exam_week ? <span className="badge">Exam</span> : null}
            </div>
            <p style={{ marginBottom: "0.25rem" }}>{week.title}</p>
            <p className="subtle" style={{ marginTop: 0 }}>
              {week.act ?? "-"} | {week.start_date}
            </p>
            <Link className="button secondary" href={`/weeks/${week.id}`}>
              Open week
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
