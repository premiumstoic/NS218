import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { FlashcardDeck } from "@/components/content/flashcard-deck";
import { QuizRunner } from "@/components/content/quiz-runner";
import { SimulationViewer } from "@/components/content/simulation-viewer";
import { CommentSection } from "@/components/discussion/comment-section";
import { getCurrentProfile } from "@/lib/auth";

type FlashcardRow = {
  id: string;
  front: string;
  back: string;
  order_index: number;
};

type QuizRow = {
  id: string;
  prompt: string;
  question_type: "single_choice" | "multiple_choice";
  explanation: string | null;
  order_index: number;
  quiz_options: { id: string; text: string; order_index: number }[];
};

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  const { data: content } = await supabase
    .from("content_items")
    .select("id,week_id,type,title,body,published_at")
    .eq("id", id)
    .not("published_at", "is", null)
    .maybeSingle();

  if (!content) {
    notFound();
  }

  const { data: week } = await supabase
    .from("weeks")
    .select("id")
    .eq("id", content.week_id)
    .eq("published", true)
    .is("archived_at", null)
    .maybeSingle();

  if (!week) {
    notFound();
  }

  let flashcardsData: FlashcardRow[] = [];
  let quizQuestionData: QuizRow[] = [];

  if (content.type === "flashcards") {
    const { data } = await supabase
      .from("flashcards")
      .select("id,front,back,order_index")
      .eq("content_item_id", content.id)
      .order("order_index", { ascending: true });

    flashcardsData = (data ?? []) as FlashcardRow[];
  }

  if (content.type === "quiz") {
    const { data } = await supabase
      .from("quiz_questions")
      .select("id,prompt,question_type,explanation,order_index,quiz_options(id,text,order_index)")
      .eq("content_item_id", content.id)
      .order("order_index", { ascending: true });

    quizQuestionData = (data ?? []) as QuizRow[];
  }

  return (
    <div className="grid">
      <section className="card">
        <span className="badge">{CONTENT_TYPE_LABELS[content.type as keyof typeof CONTENT_TYPE_LABELS]}</span>
        <h1 className="page-title" style={{ fontFamily: "var(--font-display), sans-serif", marginTop: "0.6rem" }}>
          {content.title}
        </h1>
      </section>

      {content.type === "note" || content.type === "resource" ? (
        <section className="card">
          <h2 className="section-title">Content</h2>
          {content.body?.startsWith("http") ? (
            <a href={content.body}>{content.body}</a>
          ) : (
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{content.body ?? "No content body"}</pre>
          )}
        </section>
      ) : null}

      {content.type === "flashcards" ? <FlashcardDeck flashcards={flashcardsData} /> : null}

      {content.type === "quiz" ? (
        <QuizRunner contentId={content.id} questions={quizQuestionData} canAttempt={Boolean(profile)} />
      ) : null}

      {content.type === "simulation" ? <SimulationViewer body={content.body} /> : null}

      <CommentSection targetType="content_item" targetId={content.id} />
    </div>
  );
}
