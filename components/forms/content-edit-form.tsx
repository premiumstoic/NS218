"use client";

import { FormEvent, useState } from "react";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";

export interface EditableContent {
  id: string;
  type: "note" | "flashcards" | "quiz" | "simulation" | "resource";
  title: string;
  body: string | null;
  published_at: string | null;
}

interface ContentEditFormProps {
  content: EditableContent;
}

export function ContentEditForm({ content }: ContentEditFormProps) {
  const [title, setTitle] = useState(content.title);
  const [body, setBody] = useState(content.body ?? "");
  const [published, setPublished] = useState(Boolean(content.published_at));
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const response = await fetch(`/api/teacher/content/${content.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        body: body || null,
        published_at: published ? new Date().toISOString() : null
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
    <form className="card" onSubmit={onSubmit}>
      <h4 style={{ marginTop: 0 }}>
        {CONTENT_TYPE_LABELS[content.type]}: {content.title}
      </h4>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Body
        <textarea value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <label>
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published
      </label>
      <button className="secondary">Save content</button>
      {status ? <p className="subtle">{status}</p> : null}
    </form>
  );
}
