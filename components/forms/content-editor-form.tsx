"use client";

import { FormEvent, useState } from "react";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import type { ContentType } from "@/lib/types";

export type ContentEditorWeekOption = {
  id: string;
  week_index: number;
  title: string;
};

const types: ContentType[] = ["note", "flashcards", "quiz", "simulation", "resource"];

export function ContentEditorForm({ weeks }: { weeks: ContentEditorWeekOption[] }) {
  const [weekId, setWeekId] = useState(weeks[0]?.id ?? "");
  const [type, setType] = useState<ContentType>("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(true);
  const [flashcardsJson, setFlashcardsJson] = useState(
    JSON.stringify(
      [
        { front: "What is Debye length?", back: "Electrostatic screening length in ionic solution", order_index: 0 }
      ],
      null,
      2
    )
  );
  const [questionsJson, setQuestionsJson] = useState(
    JSON.stringify(
      [
        {
          prompt: "Which quantity grows as sqrt(N) in a random walk?",
          question_type: "single_choice",
          explanation: "RMS displacement scales with sqrt(number of steps).",
          order_index: 0,
          options: [
            { text: "RMS displacement", is_correct: true, order_index: 0 },
            { text: "Mean signed displacement", is_correct: false, order_index: 1 }
          ]
        }
      ],
      null,
      2
    )
  );
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    let flashcards: unknown;
    let questions: unknown;

    try {
      flashcards = type === "flashcards" ? JSON.parse(flashcardsJson) : undefined;
      questions = type === "quiz" ? JSON.parse(questionsJson) : undefined;
    } catch {
      setStatus("Invalid JSON in flashcards/questions field");
      return;
    }

    const response = await fetch("/api/teacher/content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        week_id: weekId,
        type,
        title,
        body: body || null,
        published_at: published ? new Date().toISOString() : null,
        flashcards,
        questions
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? "Failed to create content item");
      return;
    }

    setStatus(`Created content item: ${payload.content.title}`);
    setTitle("");
    setBody("");
  }

  return (
    <form className="card form-stack" onSubmit={onSubmit}>
      <h3 className="section-title">Create Content Item</h3>

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
        Content type
        <select value={type} onChange={(e) => setType(e.target.value as ContentType)}>
          {types.map((entry) => (
            <option key={entry} value={entry}>
              {CONTENT_TYPE_LABELS[entry]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Title
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <label>
        Body
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            type === "simulation"
              ? '{"kind":"embed","url":"https://..."} or {"kind":"random-walk"}'
              : "Markdown/plain text content"
          }
        />
      </label>

      {type === "flashcards" ? (
        <label>
          Flashcards JSON
          <textarea value={flashcardsJson} onChange={(e) => setFlashcardsJson(e.target.value)} />
        </label>
      ) : null}

      {type === "quiz" ? (
        <label>
          Quiz Questions JSON
          <textarea value={questionsJson} onChange={(e) => setQuestionsJson(e.target.value)} />
        </label>
      ) : null}

      <label>
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publish now
      </label>

      <button>Create content</button>
      {status ? <p className="subtle">{status}</p> : null}
    </form>
  );
}
