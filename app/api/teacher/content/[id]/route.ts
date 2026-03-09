import { NextResponse } from "next/server";
import { parseJsonBody, apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";
import { contentPatchSchema } from "@/lib/validators/api";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await requireApiProfile({ teacherOnly: true });
    if (auth.error) {
      return auth.error;
    }

    const payload = await parseJsonBody(request, contentPatchSchema);
    const { flashcards, questions, ...contentFields } = payload;

    let updatedContent: Record<string, unknown> | null = null;

    if (Object.keys(contentFields).length > 0) {
      const { data, error } = await auth.supabase
        .from("content_items")
        .update(contentFields)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }
      updatedContent = data;
    }

    if (flashcards) {
      const { error: deleteFlashErr } = await auth.supabase.from("flashcards").delete().eq("content_item_id", id);
      if (deleteFlashErr) {
        throw deleteFlashErr;
      }

      if (flashcards.length > 0) {
        const { error: insertFlashErr } = await auth.supabase.from("flashcards").insert(
          flashcards.map((card) => ({
            content_item_id: id,
            ...card
          }))
        );
        if (insertFlashErr) {
          throw insertFlashErr;
        }
      }
    }

    if (questions) {
      const { data: existingQuestions, error: qSelectError } = await auth.supabase
        .from("quiz_questions")
        .select("id")
        .eq("content_item_id", id);

      if (qSelectError) {
        throw qSelectError;
      }

      if (existingQuestions && existingQuestions.length > 0) {
        const questionIds = existingQuestions.map((q) => q.id);
        const { error: deleteOptionsErr } = await auth.supabase.from("quiz_options").delete().in("question_id", questionIds);
        if (deleteOptionsErr) {
          throw deleteOptionsErr;
        }
      }

      const { error: deleteQuestionErr } = await auth.supabase
        .from("quiz_questions")
        .delete()
        .eq("content_item_id", id);

      if (deleteQuestionErr) {
        throw deleteQuestionErr;
      }

      for (const question of questions) {
        const { data: insertedQuestion, error: insertQuestionErr } = await auth.supabase
          .from("quiz_questions")
          .insert({
            content_item_id: id,
            prompt: question.prompt,
            question_type: question.question_type,
            explanation: question.explanation ?? null,
            order_index: question.order_index
          })
          .select("id")
          .single();

        if (insertQuestionErr || !insertedQuestion) {
          throw insertQuestionErr;
        }

        const { error: insertOptionErr } = await auth.supabase.from("quiz_options").insert(
          question.options.map((option) => ({
            question_id: insertedQuestion.id,
            text: option.text,
            is_correct: option.is_correct,
            order_index: option.order_index
          }))
        );

        if (insertOptionErr) {
          throw insertOptionErr;
        }
      }
    }

    return NextResponse.json({ content: updatedContent ?? { id } });
  } catch (error) {
    return apiError(error);
  }
}
