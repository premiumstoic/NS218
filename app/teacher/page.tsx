import { requireTeacher } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TeacherShell } from "./_components/teacher-shell";
import type { EditableWeek } from "@/components/forms/week-edit-form";
import type { EditableContent } from "@/components/forms/content-edit-form";
import type { QuizQuestion, QuizOption, Flashcard, UploadStatus } from "@/lib/types";
import Link from "next/link";

export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await requireTeacher();

  const { week: weekParam } = await searchParams;
  const supabase = await createSupabaseServerClient();

  // Always fetch full weeks list for sidebar
  const { data: allWeeks } = await supabase
    .from("weeks")
    .select("*")
    .order("week_index", { ascending: true });

  const weeks: EditableWeek[] = ((allWeeks ?? []) as Array<Record<string, unknown>>).map((w) => ({
    id: String(w.id),
    week_index: Number(w.week_index),
    title: String(w.title),
    act: w.act ? String(w.act) : null,
    start_date: String(w.start_date),
    published: Boolean(w.published),
    is_exam_week: Boolean(w.is_exam_week),
    archived_at: w.archived_at ? String(w.archived_at) : null,
  }));

  // Determine selected week: param → first active → null
  const activeWeeks = weeks.filter((w) => !w.archived_at);
  const selectedWeek =
    weeks.find((w) => w.id === weekParam) ??
    activeWeeks[0] ??
    null;

  // Fetch content + uploads scoped to selected week
  let content: EditableContent[] = [];
  let uploads: Array<{ id: string; title: string; status: UploadStatus; mime_type: string; created_at: string }> = [];
  const questionsByContentId: Record<string, (QuizQuestion & { options: QuizOption[] })[]> = {};
  const flashcardsByContentId: Record<string, Flashcard[]> = {};

  if (selectedWeek) {
    const [{ data: contentData }, { data: uploadData }] = await Promise.all([
      supabase
        .from("content_items")
        .select("id,type,title,body,published_at,updated_at")
        .eq("week_id", selectedWeek.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("uploads")
        .select("id,title,status,mime_type,created_at")
        .eq("week_id", selectedWeek.id)
        .order("created_at", { ascending: false }),
    ]);

    content = ((contentData ?? []) as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id),
      type: String(item.type) as EditableContent["type"],
      title: String(item.title),
      body: item.body ? String(item.body) : null,
      published_at: item.published_at ? String(item.published_at) : null,
    }));

    uploads = ((uploadData ?? []) as Array<Record<string, unknown>>).map((u) => ({
      id: String(u.id),
      title: String(u.title),
      status: String(u.status) as UploadStatus,
      mime_type: String(u.mime_type),
      created_at: String(u.created_at),
    }));

    // Fetch quiz questions for quiz items
    const quizIds = content.filter((c) => c.type === "quiz").map((c) => c.id);
    if (quizIds.length > 0) {
      const { data: qData } = await supabase
        .from("quiz_questions")
        .select("*, options:quiz_options(*)")
        .in("content_item_id", quizIds);
      for (const q of (qData ?? []) as Array<Record<string, unknown>>) {
        const cid = String(q.content_item_id);
        questionsByContentId[cid] ??= [];
        questionsByContentId[cid].push(q as unknown as QuizQuestion & { options: QuizOption[] });
      }
    }

    // Fetch flashcards for flashcard items
    const flashcardIds = content.filter((c) => c.type === "flashcards").map((c) => c.id);
    if (flashcardIds.length > 0) {
      const { data: fcData } = await supabase
        .from("flashcards")
        .select("*")
        .in("content_item_id", flashcardIds);
      for (const c of (fcData ?? []) as Array<Record<string, unknown>>) {
        const cid = String(c.content_item_id);
        flashcardsByContentId[cid] ??= [];
        flashcardsByContentId[cid].push(c as unknown as Flashcard);
      }
    }
  }

  return (
    <div className="teacher-page">
      <div className="teacher-page__topbar">
        <span className="teacher-page__brand">
          NS218 <span className="subtle">Teacher</span>
        </span>
        <Link href="/teacher/analytics" className="secondary" style={{ fontSize: "0.875rem" }}>
          Analytics →
        </Link>
      </div>

      <TeacherShell
        weeks={weeks}
        selectedWeek={selectedWeek}
        content={content}
        uploads={uploads}
        questionsByContentId={questionsByContentId}
        flashcardsByContentId={flashcardsByContentId}
      />
    </div>
  );
}
