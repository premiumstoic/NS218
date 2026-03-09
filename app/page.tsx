import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { examDates, syllabusActs } from "@/lib/syllabus";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: weeks }, { data: contentItems }] = await Promise.all([
    supabase.from("weeks").select("id").eq("published", true),
    supabase.from("content_items").select("id,type").not("published_at", "is", null)
  ]);

  const countByType = (contentItems ?? []).reduce<Record<string, number>>((acc, item) => {
    const type = typeof item.type === "string" ? item.type : "unknown";
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid">
      <section className="card">
        <span className="badge">Spring 2026</span>
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif", marginTop: "0.6rem" }}>
          NS218 Fundamentals of Nanoscience
        </h1>
        <p className="subtle">
          Week-centric interactive class platform for notes, flashcards, simulations, practice quizzes, uploads and threaded
          discussion.
        </p>
        <div className="row">
          <Link className="button" href="/weeks">
            Open Weekly Modules
          </Link>
          <Link className="button secondary" href="/signup">
            Create Student Account
          </Link>
        </div>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
        <article className="card">
          <p className="subtle">Published weeks</p>
          <h2 className="section-title">{weeks?.length ?? 0}</h2>
        </article>
        <article className="card">
          <p className="subtle">Notes</p>
          <h2 className="section-title">{countByType.note ?? 0}</h2>
        </article>
        <article className="card">
          <p className="subtle">Flashcards</p>
          <h2 className="section-title">{countByType.flashcards ?? 0}</h2>
        </article>
        <article className="card">
          <p className="subtle">Quizzes</p>
          <h2 className="section-title">{countByType.quiz ?? 0}</h2>
        </article>
      </section>

      <section className="card">
        <h2 className="section-title">Syllabus at a Glance</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          {syllabusActs.map((act) => (
            <article key={act.act} className="card" style={{ background: "var(--surface-soft)" }}>
              <p className="badge">{act.act}</p>
              <h3 style={{ marginBottom: "0.35rem" }}>{act.theme}</h3>
              <p className="subtle" style={{ marginTop: 0 }}>
                {act.dateRange}
              </p>
              <ul>
                {act.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Exam Timeline</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          {examDates.map((exam) => (
            <article key={exam.label} className="card">
              <strong>{exam.label}</strong>
              <p className="subtle">{exam.date}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
