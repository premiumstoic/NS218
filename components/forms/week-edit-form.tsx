"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export interface EditableWeek {
  id: string;
  week_index: number;
  title: string;
  act: string | null;
  start_date: string;
  published: boolean;
  is_exam_week: boolean;
  archived_at: string | null;
}

interface WeekEditFormProps {
  week: EditableWeek;
}

export function WeekEditForm({ week }: WeekEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(week.title);
  const [act, setAct] = useState(week.act ?? "");
  const [startDate, setStartDate] = useState(week.start_date);
  const [published, setPublished] = useState(week.published);
  const [isExamWeek, setIsExamWeek] = useState(week.is_exam_week);
  const [archivedAt, setArchivedAt] = useState(week.archived_at);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    setBusy(true);

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
      setBusy(false);
      return;
    }

    setStatus("Saved");
    setBusy(false);
    router.refresh();
  }

  async function onArchiveToggle() {
    setStatus(null);
    setBusy(true);

    if (!archivedAt) {
      const confirmed = window.confirm(`Archive Week ${week.week_index}? Students will no longer see it.`);
      if (!confirmed) {
        setBusy(false);
        return;
      }
    }

    const response = await fetch(
      archivedAt ? `/api/teacher/weeks/${week.id}/restore` : `/api/teacher/weeks/${week.id}`,
      { method: archivedAt ? "POST" : "DELETE" }
    );
    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? "Week action failed");
      setBusy(false);
      return;
    }

    setArchivedAt(payload.week.archived_at ? String(payload.week.archived_at) : null);
    setStatus(archivedAt ? "Week restored" : "Week archived");
    setBusy(false);
    router.refresh();
  }

  return (
    <form className="card form-stack" onSubmit={onSubmit}>
      <h4 style={{ marginTop: 0 }}>
        Week {week.week_index} {archivedAt ? "(Archived)" : ""}
      </h4>
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

      {archivedAt ? (
        <p className="subtle" style={{ margin: 0 }}>
          Archived at {new Date(archivedAt).toLocaleString()}
        </p>
      ) : null}

      <div className="row">
        <button className="secondary" disabled={busy}>
          {busy ? "Working..." : "Save week"}
        </button>
        <button
          className={archivedAt ? "secondary" : "danger"}
          type="button"
          onClick={onArchiveToggle}
          disabled={busy}
        >
          {busy ? "Working..." : archivedAt ? "Restore" : "Archive"}
        </button>
      </div>
      {status ? <p className="subtle">{status}</p> : null}
    </form>
  );
}
