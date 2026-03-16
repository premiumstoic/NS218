"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import type { ContentType } from "@/lib/types";
import { QuizBuilder, newQuestion, validateQuestions, toApiQuestions } from "@/components/forms/quiz-builder";
import type { DraftQuestion, QuizBuilderErrors } from "@/components/forms/quiz-builder";
import { FlashcardBuilder, newCard, validateCards, toApiFlashcards } from "@/components/forms/flashcard-builder";
import type { DraftCard, FlashcardBuilderErrors } from "@/components/forms/flashcard-builder";

export type ContentEditorWeekOption = {
  id: string;
  week_index: number;
  title: string;
};

const types: ContentType[] = ["note", "flashcards", "quiz", "simulation", "resource"];

interface ContentEditorFormProps {
  weeks: ContentEditorWeekOption[];
  defaultWeekId?: string;
  onSuccess?: () => void;
}

export function ContentEditorForm({ weeks, defaultWeekId, onSuccess }: ContentEditorFormProps) {
  const router = useRouter();
  const [weekId, setWeekId] = useState(defaultWeekId ?? weeks[0]?.id ?? "");
  const [type, setType] = useState<ContentType>("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(true);
  const [cards, setCards] = useState<DraftCard[]>([newCard()]);
  const [cardErrors, setCardErrors] = useState<FlashcardBuilderErrors>({});
  const [questions, setQuestions] = useState<DraftQuestion[]>([newQuestion()]);
  const [quizErrors, setQuizErrors] = useState<QuizBuilderErrors>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!weekId) {
      toast.error("Create or restore at least one active week first.");
      return;
    }

    let flashcards: unknown;
    let apiQuestions: unknown;

    if (type === "flashcards") {
      const errs = validateCards(cards);
      if (Object.keys(errs).length > 0) {
        setCardErrors(errs);
        toast.error("Please fix the errors in your flashcards.");
        return;
      }
      setCardErrors({});
      flashcards = toApiFlashcards(cards);
    }

    if (type === "quiz") {
      const errs = validateQuestions(questions);
      if (Object.keys(errs).length > 0) {
        setQuizErrors(errs);
        toast.error("Please fix the errors in your quiz questions.");
        return;
      }
      setQuizErrors({});
      apiQuestions = toApiQuestions(questions);
    }

    setBusy(true);
    const response = await fetch("/api/teacher/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_id: weekId,
        type,
        title,
        body: body || null,
        published_at: published ? new Date().toISOString() : null,
        flashcards,
        questions: apiQuestions,
      }),
    });

    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Failed to create content item");
      return;
    }

    toast.success(`Created: ${payload.content.title}`);
    setTitle("");
    setBody("");
    setCards([newCard()]);
    setCardErrors({});
    setQuestions([newQuestion()]);
    setQuizErrors({});
    router.refresh();
    onSuccess?.();
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <label>
        Week
        <select value={weekId} onChange={(e) => setWeekId(e.target.value)} required disabled={weeks.length === 0}>
          {weeks.map((week) => (
            <option key={week.id} value={week.id}>
              Week {week.week_index}: {week.title}
            </option>
          ))}
        </select>
      </label>
      {weeks.length === 0 && <p className="subtle">No active weeks available.</p>}

      <label>
        Content type
        <select value={type} onChange={(e) => setType(e.target.value as ContentType)}>
          {types.map((entry) => (
            <option key={entry} value={entry}>{CONTENT_TYPE_LABELS[entry]}</option>
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

      {type === "flashcards" && (
        <FlashcardBuilder value={cards} onChange={setCards} errors={cardErrors} />
      )}

      {type === "quiz" && (
        <QuizBuilder value={questions} onChange={setQuestions} errors={quizErrors} />
      )}

      <label>
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publish now
      </label>

      <button disabled={busy}>{busy ? "Creating…" : "Create content"}</button>
    </form>
  );
}
