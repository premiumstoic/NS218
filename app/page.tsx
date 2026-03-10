import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { examDates, syllabusActs } from "@/lib/syllabus";
import { LatestCarousel, type LatestCarouselItem } from "@/components/home/latest-carousel";

type WeekRow = {
  id: string;
  week_index: number;
  title: string;
  act: string | null;
  start_date: string;
  is_exam_week: boolean;
};

type ContentRow = {
  id: string;
  week_id: string;
  type: keyof typeof CONTENT_TYPE_LABELS;
  title: string;
  published_at: string | null;
};

type UploadRow = {
  id: string;
  week_id: string;
  title: string;
  created_at: string;
};

function weekLabel(week: Pick<WeekRow, "week_index" | "title">) {
  return `Week ${week.week_index}: ${week.title}`;
}

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: authData }, { data: weekRows }, { data: rawContentRows }, { data: rawUploadRows }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("weeks")
      .select("id,week_index,title,act,start_date,is_exam_week")
      .eq("published", true)
      .is("archived_at", null)
      .order("start_date", { ascending: true }),
    supabase
      .from("content_items")
      .select("id,week_id,type,title,published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false }),
    supabase
      .from("uploads")
      .select("id,week_id,title,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
  ]);

  const isLoggedIn = Boolean(authData.user);

  const weeks = (weekRows ?? []) as WeekRow[];
  const weekMap = new Map(weeks.map((week) => [week.id, week]));

  const contentRows = ((rawContentRows ?? []) as ContentRow[]).filter((item) => weekMap.has(item.week_id));
  const uploadRows = ((rawUploadRows ?? []) as UploadRow[]).filter((item) => weekMap.has(item.week_id));

  const countByType = contentRows.reduce<Record<string, number>>((acc, item) => {
    const type = item.type;
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  const latestContentItems: LatestCarouselItem[] = contentRows
    .filter((item) => item.published_at)
    .map((item) => {
      const week = weekMap.get(item.week_id)!;
      return {
        id: `content-${item.id}`,
        kind: "content",
        title: item.title,
        href: `/content/${item.id}`,
        weekLabel: weekLabel(week),
        timestamp: item.published_at!,
        kindLabel: CONTENT_TYPE_LABELS[item.type]
      };
    });

  const latestUploadItems: LatestCarouselItem[] = uploadRows.map((item) => {
    const week = weekMap.get(item.week_id)!;
    return {
      id: `upload-${item.id}`,
      kind: "upload",
      title: item.title,
      href: `/uploads/${item.id}`,
      weekLabel: weekLabel(week),
      timestamp: item.created_at,
      kindLabel: "Student Upload"
    };
  });

  const latestItems = [...latestContentItems, ...latestUploadItems]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  const todayIso = new Date().toISOString().slice(0, 10);
  let ongoingIndex = -1;

  weeks.forEach((week, index) => {
    if (week.start_date <= todayIso) {
      ongoingIndex = index;
    }
  });

  const ongoingWeek = ongoingIndex >= 0 ? weeks[ongoingIndex] : null;
  const previousWeek = ongoingIndex > 0 ? weeks[ongoingIndex - 1] : null;

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
          {!isLoggedIn ? (
            <Link className="button secondary" href="/signup">
              Create Student Account
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
        <article className="card">
          <p className="subtle">Published weeks</p>
          <h2 className="section-title">{weeks.length}</h2>
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

      <LatestCarousel items={latestItems} />

      <section className="card">
        <h2 className="section-title">Ongoing Week</h2>
        {ongoingWeek ? (
          <>
            <p style={{ marginBottom: "0.35rem" }}>
              <strong>{weekLabel(ongoingWeek)}</strong>
            </p>
            <p className="subtle" style={{ marginTop: 0 }}>
              {ongoingWeek.act ?? "-"} | Starts {ongoingWeek.start_date}
            </p>
            <Link className="button secondary" href={`/weeks/${ongoingWeek.id}`}>
              Open Ongoing Week
            </Link>
          </>
        ) : (
          <p className="subtle">No ongoing week yet. Check back when the first module starts.</p>
        )}
      </section>

      <section className="card">
        <h2 className="section-title">Previous Week</h2>
        {previousWeek ? (
          <>
            <p style={{ marginBottom: "0.35rem" }}>
              <strong>{weekLabel(previousWeek)}</strong>
            </p>
            <p className="subtle" style={{ marginTop: 0 }}>
              {previousWeek.act ?? "-"} | Starts {previousWeek.start_date}
            </p>
            <Link className="button secondary" href={`/weeks/${previousWeek.id}`}>
              Open Previous Week
            </Link>
          </>
        ) : (
          <p className="subtle">No previous week available yet.</p>
        )}
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
