import { z } from "zod";
import { ACCEPTED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";

export const weekCreateSchema = z.object({
  course_code: z.string().min(1).default("NS218"),
  week_index: z.coerce.number().int().min(1),
  title: z.string().min(3),
  act: z.string().nullable().optional(),
  start_date: z.string().date(),
  is_exam_week: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(false)
});

export const weekPatchSchema = weekCreateSchema.partial();

export const contentCreateSchema = z.object({
  week_id: z.string().uuid(),
  type: z.enum(["note", "flashcards", "quiz", "simulation", "resource"]),
  title: z.string().min(3),
  body: z.string().nullable().optional(),
  published_at: z.string().datetime().nullable().optional(),
  flashcards: z
    .array(
      z.object({
        front: z.string().min(1),
        back: z.string().min(1),
        order_index: z.number().int().min(0)
      })
    )
    .optional(),
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1),
        question_type: z.enum(["single_choice", "multiple_choice"]),
        explanation: z.string().nullable().optional(),
        order_index: z.number().int().min(0),
        options: z.array(
          z.object({
            text: z.string().min(1),
            is_correct: z.boolean(),
            order_index: z.number().int().min(0)
          })
        )
      })
    )
    .optional()
});

export const contentPatchSchema = contentCreateSchema.partial().extend({
  week_id: z.string().uuid().optional()
});

export const commentCreateSchema = z.object({
  target_type: z.enum(["week", "content_item", "upload"]),
  target_id: z.string().uuid(),
  body: z.string().min(1).max(3000)
});

export const quizAttemptSchema = z.object({
  answers: z.record(z.string(), z.array(z.string()))
});

export const uploadModerationSchema = z.object({
  status: z.enum(["published", "hidden"])
});

export const uploadMetadataCreateSchema = z.object({
  title: z.string().min(1).max(300),
  week_id: z.string().uuid(),
  file_url: z.string().url(),
  mime_type: z.string().refine((value) => ACCEPTED_UPLOAD_MIME_TYPES.includes(value), {
    message: "Unsupported MIME type"
  }),
  storage_path: z.string().min(1).max(500).optional(),
  size_bytes: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_SIZE_BYTES, `File too large. Maximum is ${MAX_UPLOAD_SIZE_BYTES} bytes.`)
    .optional()
});
