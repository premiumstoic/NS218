"use client";

import { FormEvent, useState } from "react";

export function WeekEditorForm() {
  const [weekIndex, setWeekIndex] = useState(1);
  const [title, setTitle] = useState("");
  const [act, setAct] = useState("");
  const [startDate, setStartDate] = useState("");
  const [published, setPublished] = useState(true);
  const [isExamWeek, setIsExamWeek] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);

    const response = await fetch("/api/teacher/weeks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        course_code: "NS218",
        week_index: weekIndex,
        title,
        act: act || null,
        start_date: startDate,
        is_exam_week: isExamWeek,
        published
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? "Could not create week");
      return;
    }

    setStatus(`Created week: ${payload.week.title}`);
    setTitle("");
    setAct("");
  }

  return (
    <form className="card form-stack" onSubmit={onSubmit}>
      <h3 className="section-title">Create Week</h3>

      <label>
        Week index
        <input type="number" min={1} value={weekIndex} onChange={(e) => setWeekIndex(Number(e.target.value))} required />
      </label>

      <label>
        Title
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <label>
        Act
        <input type="text" value={act} onChange={(e) => setAct(e.target.value)} placeholder="Act I / Act II / Exam" />
      </label>

      <label>
        Start date
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </label>

      <label>
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published
      </label>

      <label>
        <input type="checkbox" checked={isExamWeek} onChange={(e) => setIsExamWeek(e.target.checked)} /> Exam week
      </label>

      <button>Create week</button>
      {status ? <p className="subtle">{status}</p> : null}
    </form>
  );
}
