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

  // Group consecutive weeks by act
  const groups: { act: string | null; weeks: NonNullable<typeof weeks> }[] = [];
  for (const week of weeks ?? []) {
    const last = groups[groups.length - 1];
    if (!last || last.act !== week.act) {
      groups.push({ act: week.act, weeks: [week] });
    } else {
      last.weeks.push(week);
    }
  }

  return (
    <div className="student-page">
      <header className="student-page__header">
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Weekly Modules
        </h1>
        <p className="subtle">Notes, flashcards, quizzes, simulations, and discussion — one week at a time.</p>
      </header>

      {groups.map(({ act, weeks: actWeeks }, i) => (
        <section key={`${i}-${act ?? "default"}`} className="act-section">
          {act && <h2 className="act-section__title">{act}</h2>}
          <div className="week-list">
            {actWeeks.map((week) => (
              <Link key={week.id} href={`/weeks/${week.id}`} className="week-list-item">
                <span className="week-list-item__index">W{week.week_index}</span>
                <div className="week-list-item__info">
                  <span className="week-list-item__title">{week.title}</span>
                  {week.start_date && (
                    <span className="subtle">
                      {new Date(week.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
                {week.is_exam_week && <span className="badge">Exam</span>}
                <span className="week-list-item__arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
