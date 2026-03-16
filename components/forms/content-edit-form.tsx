"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { QuizBuilder, validateQuestions, toApiQuestions } from "@/components/forms/quiz-builder";
import type { DraftQuestion, DraftOption, QuizBuilderErrors } from "@/components/forms/quiz-builder";
import { FlashcardBuilder, validateCards, toApiFlashcards, toDraftCards } from "@/components/forms/flashcard-builder";
import type { DraftCard, FlashcardBuilderErrors } from "@/components/forms/flashcard-builder";
import type { QuizQuestion, QuizOption, Flashcard } from "@/lib/types";

export interface EditableContent {
  id: string;
  type: "note" | "flashcards" | "quiz" | "simulation" | "resource";
  title: string;
  body: string | null;
  published_at: string | null;
}

interface ContentEditFormProps {
  content: EditableContent;
  initialQuestions?: (QuizQuestion & { options: QuizOption[] })[];
  initialFlashcards?: Flashcard[];
  onSuccess?: () => void;
}

function toDraftQuestions(questions: (QuizQuestion & { options: QuizOption[] })[]): DraftQuestion[] {
  return questions
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      question_type: q.question_type,
      explanation: q.explanation ?? "",
      options: q.options
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((o): DraftOption => ({ id: o.id, text: o.text, is_correct: o.is_correct })),
    }));
}

export function ContentEditForm({ content, initialQuestions, initialFlashcards, onSuccess }: ContentEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(content.title);
  const [body, setBody] = useState(content.body ?? "");
  const [published, setPublished] = useState(Boolean(content.published_at));
  const [cards, setCards] = useState<DraftCard[]>(
    content.type === "flashcards" && initialFlashcards ? toDraftCards(initialFlashcards) : []
  );
  const [cardErrors, setCardErrors] = useState<FlashcardBuilderErrors>({});
  const [questions, setQuestions] = useState<DraftQuestion[]>(
    content.type === "quiz" && initialQuestions ? toDraftQuestions(initialQuestions) : []
  );
  const [quizErrors, setQuizErrors] = useState<QuizBuilderErrors>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    let apiFlashcards: ReturnType<typeof toApiFlashcards> | undefined;
    let apiQuestions: ReturnType<typeof toApiQuestions> | undefined;

    if (content.type === "flashcards") {
      const errs = validateCards(cards);
      if (Object.keys(errs).length > 0) {
        setCardErrors(errs);
        toast.error("Please fix the errors in your flashcards.");
        return;
      }
      setCardErrors({});
      apiFlashcards = toApiFlashcards(cards);
    }

    if (content.type === "quiz") {
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
    const response = await fetch(`/api/teacher/content/${content.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body: body || null,
        published_at: published ? new Date().toISOString() : null,
        flashcards: apiFlashcards,
        questions: apiQuestions,
      }),
    });

    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Update failed");
      return;
    }

    toast.success("Content saved");
    router.refresh();
    onSuccess?.();
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <p className="subtle" style={{ margin: 0 }}>{CONTENT_TYPE_LABELS[content.type]}</p>
      <label>
        Title
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Body
        <textarea value={body} onChange={(e) => setBody(e.target.value)} />
      </label>

      {content.type === "flashcards" && (
        <FlashcardBuilder value={cards} onChange={setCards} errors={cardErrors} />
      )}

      {content.type === "quiz" && (
        <QuizBuilder value={questions} onChange={setQuestions} errors={quizErrors} />
      )}

      <label>
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published
      </label>
      <button disabled={busy}>{busy ? "Saving…" : "Save content"}</button>
    </form>
  );
}
