import { examDates, syllabusActs } from "@/lib/syllabus";

export default function SyllabusPage() {
  return (
    <div className="grid">
      <section className="card">
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif" }}>
          NS218 Syllabus Map
        </h1>
        <p className="subtle">Structured from the Spring 2026 syllabus document.</p>
      </section>

      {syllabusActs.map((act) => (
        <section className="card" key={act.act}>
          <div className="row">
            <h2 className="section-title">
              {act.act}: {act.theme}
            </h2>
            <span className="badge">{act.dateRange}</span>
          </div>
          <ul>
            {act.topics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card">
        <h2 className="section-title">Exams</h2>
        <ul>
          {examDates.map((exam) => (
            <li key={exam.label}>
              <strong>{exam.label}</strong>: {exam.date}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
