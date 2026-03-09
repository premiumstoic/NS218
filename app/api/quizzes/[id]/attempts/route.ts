import { NextResponse } from "next/server";
import { parseJsonBody, apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";
import { quizAttemptSchema } from "@/lib/validators/api";

type QuestionRow = {
  id: string;
  explanation: string | null;
  quiz_options: Array<{ id: string; is_correct: boolean }> | null;
};

function toSortedSet(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function sameStringArray(a: string[], b: string[]) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((v, idx) => v === b[idx]);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await requireApiProfile();
    if (auth.error) {
      return auth.error;
    }

    const payload = await parseJsonBody(request, quizAttemptSchema);

    const { data: questions, error: questionError } = await auth.supabase
      .from("quiz_questions")
      .select("id,prompt,explanation,question_type,quiz_options(id,is_correct)")
      .eq("content_item_id", id)
      .order("order_index", { ascending: true });

    if (questionError) {
      throw questionError;
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "Quiz has no questions" }, { status: 400 });
    }

    let correctCount = 0;
    const feedback: Record<string, { isCorrect: boolean; explanation: string | null }> = {};

    for (const question of questions as QuestionRow[]) {
      const selected = toSortedSet(payload.answers[question.id] ?? []);
      const correct = toSortedSet((question.quiz_options ?? []).filter((option) => option.is_correct).map((option) => option.id));
      const isCorrect = sameStringArray(selected, correct);

      if (isCorrect) {
        correctCount += 1;
      }

      feedback[question.id] = {
        isCorrect,
        explanation: question.explanation ?? null
      };
    }

    const score = Number(((correctCount / questions.length) * 100).toFixed(2));

    const { data: attempt, error: insertError } = await auth.supabase
      .from("quiz_attempts")
      .insert({
        content_item_id: id,
        user_id: auth.profile.id,
        score,
        answers: payload.answers,
        feedback,
        started_at: new Date().toISOString(),
        submitted_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      attempt,
      result: {
        score,
        totalQuestions: questions.length,
        correctCount,
        feedback
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
