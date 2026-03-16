import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { FlashcardDeck } from "@/components/content/flashcard-deck";
import { QuizRunner } from "@/components/content/quiz-runner";
import { SimulationViewer } from "@/components/content/simulation-viewer";
import { CommentSection } from "@/components/discussion/comment-section";
import { getCurrentProfile } from "@/lib/auth";
import { ProgressTracker } from "@/components/progress/progress-tracker";

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
    .select("id,week_index,title")
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

  const typeLabel = CONTENT_TYPE_LABELS[content.type as keyof typeof CONTENT_TYPE_LABELS];

  return (
    <div className="student-page">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/weeks">Weeks</Link>
        <span className="breadcrumb__sep">›</span>
        <Link href={`/weeks/${week.id}`}>Week {week.week_index}</Link>
        <span className="breadcrumb__sep">›</span>
        <span>{content.title}</span>
      </nav>

      {/* Header */}
      <header className="week-hero">
        <div className="week-hero__meta">
          <span className="badge">{typeLabel}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <h1 className="week-hero__title">{content.title}</h1>
          {profile?.role === "student" && (
            <ProgressTracker weekId={content.week_id} contentItemId={content.id} />
          )}
        </div>
      </header>

      {/* Note / Resource body */}
      {(content.type === "note" || content.type === "resource") && (
        <section className="card">
          {content.body?.startsWith("http") ? (
            <a href={content.body} target="_blank" rel="noopener noreferrer" className="button secondary">
              Open resource ↗
            </a>
          ) : (
            <div className="note-body">
              {(content.body ?? "No content body").split("\n\n").map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
        </section>
      )}

      {content.type === "flashcards" && <FlashcardDeck flashcards={flashcardsData} />}

      {content.type === "quiz" && (
        <QuizRunner contentId={content.id} questions={quizQuestionData} canAttempt={Boolean(profile)} />
      )}

      {content.type === "simulation" && <SimulationViewer body={content.body} />}

      <CommentSection targetType="content_item" targetId={content.id} />
    </div>
  );
}
