import "@/components/analytics/analytics.css";
import StatCard from "@/components/analytics/stat-card";
import DataTable from "@/components/analytics/data-table";
import { requireTeacher } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  await requireTeacher();

  const supabase = await createSupabaseServerClient();

  const [quizAnalyticsRes, studentPerfRes, weeklyEngageRes] = await Promise.all([
    supabase.from("quiz_analytics").select("*"),
    supabase.from("student_quiz_performance").select("*"),
    supabase.from("weekly_engagement").select("*"),
  ]);

  const quizAnalytics = quizAnalyticsRes.data ?? [];
  const studentPerformance = studentPerfRes.data ?? [];
  const weeklyEngagement = weeklyEngageRes.data ?? [];

  // pass_rate and quiz_participation_rate are already 0–100 from the DB views
  const avgQuizScore =
    studentPerformance.length > 0
      ? studentPerformance.reduce((sum, s) => sum + (s.average_score ?? 0), 0) / studentPerformance.length
      : 0;
  const avgPassRate =
    quizAnalytics.length > 0
      ? quizAnalytics.reduce((sum, q) => sum + (q.pass_rate ?? 0), 0) / quizAnalytics.length
      : 0;
  const avgParticipation =
    weeklyEngagement.length > 0
      ? weeklyEngagement.reduce((sum, w) => sum + (w.quiz_participation_rate ?? 0), 0) / weeklyEngagement.length
      : 0;

  return (
    <div className="student-page" style={{ maxWidth: 960 }}>
      <header className="student-page__header">
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          Analytics
        </h1>
        <p className="subtle">Quiz performance, student engagement, and weekly participation.</p>
      </header>

      {/* Summary stat cards */}
      <section>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          <StatCard label="Total Students" value={studentPerformance.length} />
          <StatCard label="Avg Quiz Score" value={Math.round(avgQuizScore)} unit="pts" />
          <StatCard label="Quiz Pass Rate" value={`${Math.round(avgPassRate)}%`} />
          <StatCard label="Avg Participation" value={`${Math.round(avgParticipation)}%`} />
        </div>
      </section>

      {/* Quiz Performance */}
      <section className="card">
        <DataTable
          title="Quiz Performance"
          columns={[
            { key: "quiz_title", label: "Quiz" },
            { key: "average_score", label: "Avg Score", align: "right" },
            { key: "pass_rate", label: "Pass Rate", align: "right" },
            { key: "total_attempts", label: "Attempts", align: "right" },
          ]}
          rows={quizAnalytics.map((q) => ({
            quiz_title: q.quiz_title,
            average_score: Math.round(q.average_score ?? 0),
            pass_rate: `${Math.round(q.pass_rate ?? 0)}%`,
            total_attempts: q.total_attempts,
          }))}
          emptyMessage="No quiz attempts yet."
        />
      </section>

      {/* Student Performance */}
      <section className="card">
        <DataTable
          title="Student Performance"
          columns={[
            { key: "display_name", label: "Student" },
            { key: "average_score", label: "Avg Score", align: "right" },
            { key: "pass_rate", label: "Pass Rate", align: "right" },
            { key: "quizzes_attempted", label: "Quizzes Taken", align: "right" },
          ]}
          rows={studentPerformance.map((s) => ({
            display_name: s.display_name ?? s.email ?? "—",
            average_score: Math.round(s.average_score ?? 0),
            pass_rate: `${Math.round(s.pass_rate ?? 0)}%`,
            quizzes_attempted: s.quizzes_attempted,
          }))}
          emptyMessage="No students have attempted quizzes yet."
        />
      </section>

      {/* Weekly Engagement */}
      <section className="card">
        <DataTable
          title="Weekly Engagement"
          columns={[
            { key: "week_title", label: "Week" },
            { key: "content_items_published", label: "Content Items", align: "right" },
            { key: "students_viewing", label: "Students Active", align: "right" },
            { key: "quiz_participation_rate", label: "Quiz Participation", align: "right" },
          ]}
          rows={weeklyEngagement.map((w) => ({
            week_title: w.week_title,
            content_items_published: w.content_items_published,
            students_viewing: w.students_viewing,
            quiz_participation_rate: `${Math.round(w.quiz_participation_rate ?? 0)}%`,
          }))}
          emptyMessage="No engagement data yet."
        />
      </section>
    </div>
  );
}
