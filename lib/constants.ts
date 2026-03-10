import { ContentType } from "@/lib/types";

export const COURSE_CODE = "NS218";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  note: "Note",
  flashcards: "Flashcards",
  quiz: "Quiz",
  simulation: "Simulation",
  resource: "Resource"
};

export const ACCEPTED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
];

export const ACCEPTED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx"
];

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

export const BUILTIN_SIMULATION_KINDS = ["random-walk", "binding-curve"] as const;
