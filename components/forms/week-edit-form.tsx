"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
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
  onSuccess?: () => void;
}

export function WeekEditForm({ week, onSuccess }: WeekEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(week.title);
  const [act, setAct] = useState(week.act ?? "");
  const [startDate, setStartDate] = useState(week.start_date);
  const [published, setPublished] = useState(week.published);
  const [isExamWeek, setIsExamWeek] = useState(week.is_exam_week);
  const [busy, setBusy] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);

    const response = await fetch(`/api/teacher/weeks/${week.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        act: act || null,
        start_date: startDate,
        published,
        is_exam_week: isExamWeek,
      }),
    });

    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Update failed");
      return;
    }

    toast.success("Week saved");
    router.refresh();
    onSuccess?.();
  }

  async function onArchiveToggle() {
    setArchiveBusy(true);
    const isArchived = !!week.archived_at;

    let response: Response;
    if (isArchived) {
      response = await fetch(`/api/teacher/weeks/${week.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived_at: null }),
      });
    } else {
      response = await fetch(`/api/teacher/weeks/${week.id}`, { method: "DELETE" });
    }

    const payload = await response.json();
    setArchiveBusy(false);

    if (!response.ok) {
      toast.error(payload.error ?? (isArchived ? "Restore failed" : "Archive failed"));
      return;
    }

    toast.success(isArchived ? "Week restored" : "Week archived");
    router.refresh();
    onSuccess?.();
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      {week.archived_at && (
        <p className="subtle" style={{ margin: 0 }}>
          Archived {new Date(week.archived_at).toLocaleDateString()}
        </p>
      )}
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
      <button disabled={busy}>{busy ? "Saving…" : "Save week"}</button>
      <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "0.5rem 0" }} />
      <button
        type="button"
        className="secondary"
        style={{ color: week.archived_at ? undefined : "var(--error, #dc2626)" }}
        disabled={archiveBusy}
        onClick={onArchiveToggle}
      >
        {archiveBusy
          ? week.archived_at ? "Restoring…" : "Archiving…"
          : week.archived_at ? "Restore week" : "Archive week"}
      </button>
    </form>
  );
}
