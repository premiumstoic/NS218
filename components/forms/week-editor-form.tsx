"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface WeekEditorFormProps {
  onSuccess?: () => void;
}

export function WeekEditorForm({ onSuccess }: WeekEditorFormProps) {
  const router = useRouter();
  const [weekIndex, setWeekIndex] = useState(1);
  const [title, setTitle] = useState("");
  const [act, setAct] = useState("");
  const [startDate, setStartDate] = useState("");
  const [published, setPublished] = useState(true);
  const [isExamWeek, setIsExamWeek] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);

    const response = await fetch("/api/teacher/weeks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_code: "NS218",
        week_index: weekIndex,
        title,
        act: act || null,
        start_date: startDate,
        is_exam_week: isExamWeek,
        published,
      }),
    });

    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Could not create week");
      return;
    }

    toast.success(`Week created: ${payload.week.title}`);
    setTitle("");
    setAct("");
    router.refresh();
    onSuccess?.();
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
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
      <button disabled={busy}>{busy ? "Creating…" : "Create week"}</button>
    </form>
  );
}
