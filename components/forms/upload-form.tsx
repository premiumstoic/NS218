"use client";

import { FormEvent, useState } from "react";

export type UploadWeekOption = {
  id: string;
  week_index: number;
  title: string;
};

interface UploadFormProps {
  weeks: UploadWeekOption[];
  onUploaded?: () => void;
}

export function UploadForm({ weeks, onUploaded }: UploadFormProps) {
  const [title, setTitle] = useState("");
  const [weekId, setWeekId] = useState(weeks[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file || !weekId || !title.trim()) {
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("week_id", weekId);
    formData.append("file", file);

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? "Upload failed");
      setLoading(false);
      return;
    }

    setStatus("Uploaded successfully");
    setTitle("");
    setFile(null);
    onUploaded?.();
    setLoading(false);
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h3 className="section-title">Upload Class Material</h3>
      <p className="subtle">Allowed: PDF, PNG/JPG/WEBP, DOC/DOCX, PPT/PPTX</p>

      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <label>
        Week
        <select value={weekId} onChange={(e) => setWeekId(e.target.value)} required>
          {weeks.map((week) => (
            <option key={week.id} value={week.id}>
              Week {week.week_index}: {week.title}
            </option>
          ))}
        </select>
      </label>

      <label>
        File
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx"
          required
        />
      </label>

      <button disabled={loading}>{loading ? "Uploading..." : "Upload"}</button>
      {status ? <p className="subtle">{status}</p> : null}
    </form>
  );
}
