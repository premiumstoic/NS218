"use client";

import { FormEvent, useState } from "react";

export interface EditableWeek {
  id: string;
  week_index: number;
  title: string;
  act: string | null;
  start_date: string;
  published: boolean;
  is_exam_week: boolean;
}

interface WeekEditFormProps {
  week: EditableWeek;
}

export function WeekEditForm({ week }: WeekEditFormProps) {
  const [title, setTitle] = useState(week.title);
  const [act, setAct] = useState(week.act ?? "");
  const [startDate, setStartDate] = useState(week.start_date);
  const [published, setPublished] = useState(week.published);
  const [isExamWeek, setIsExamWeek] = useState(week.is_exam_week);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);

    const response = await fetch(`/api/teacher/weeks/${week.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        act: act || null,
        start_date: startDate,
        published,
        is_exam_week: isExamWeek
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Update failed");
      return;
    }

    setStatus("Saved");
  }

  return (
    <form className="card form-stack" onSubmit={onSubmit}>
      <h4 style={{ marginTop: 0 }}>Week {week.week_index}</h4>
      <label>
        Title
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Act
        <input type="text" value={act} onChange={(e) => setAct(e.target.value)} />
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
      <button className="secondary">Save week</button>
      {status ? <p className="subtle">{status}</p> : null}
    </form>
  );
}
