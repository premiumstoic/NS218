import { NextResponse } from "next/server";
import { parseJsonBody, apiError } from "@/lib/api";
import { requireApiProfile } from "@/lib/api-auth";
import { contentCreateSchema } from "@/lib/validators/api";

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile({ teacherOnly: true });
    if (auth.error) {
      return auth.error;
    }

    const payload = await parseJsonBody(request, contentCreateSchema);

    const { flashcards, questions, ...contentFields } = payload;

    const { data: content, error: contentError } = await auth.supabase
      .from("content_items")
      .insert({
        ...contentFields,
        created_by: auth.profile.id
      })
      .select("*")
      .single();

    if (contentError || !content) {
      throw contentError;
    }

    if (content.type === "flashcards" && flashcards && flashcards.length > 0) {
      const { error: flashError } = await auth.supabase.from("flashcards").insert(
        flashcards.map((card) => ({
          content_item_id: content.id,
          ...card
        }))
      );

      if (flashError) {
        await auth.supabase.from("content_items").delete().eq("id", content.id);
        throw flashError;
      }
    }

    if (content.type === "quiz" && questions && questions.length > 0) {
      for (const question of questions) {
        const { data: q, error: qError } = await auth.supabase
          .from("quiz_questions")
          .insert({
            content_item_id: content.id,
            prompt: question.prompt,
            question_type: question.question_type,
            explanation: question.explanation ?? null,
            order_index: question.order_index
          })
          .select("id")
          .single();

        if (qError || !q) {
          await auth.supabase.from("content_items").delete().eq("id", content.id);
          throw qError;
        }

        const { error: optionsError } = await auth.supabase.from("quiz_options").insert(
          question.options.map((option) => ({
            question_id: q.id,
            text: option.text,
            is_correct: option.is_correct,
            order_index: option.order_index
          }))
        );

        if (optionsError) {
          await auth.supabase.from("content_items").delete().eq("id", content.id);
          throw optionsError;
        }
      }
    }

    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
