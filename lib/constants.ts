import { ContentType, ThemeToken } from "@/lib/types";

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

export const PROFILE_THEME_OPTIONS: Array<{
  token: ThemeToken;
  label: string;
  cardBackground: string;
  cardBorder: string;
}> = [
  { token: "sage", label: "Sage", cardBackground: "#eaf4ec", cardBorder: "#bfd8c7" },
  { token: "ocean", label: "Ocean", cardBackground: "#e8f3f9", cardBorder: "#b7d2e4" },
  { token: "amber", label: "Amber", cardBackground: "#fff5e6", cardBorder: "#edd0a0" },
  { token: "rose", label: "Rose", cardBackground: "#fdeef2", cardBorder: "#e8c0cc" },
  { token: "slate", label: "Slate", cardBackground: "#eceff3", cardBorder: "#c7ced8" }
];

export const PROFILE_THEME_MAP = Object.fromEntries(
  PROFILE_THEME_OPTIONS.map((option) => [option.token, option])
) as Record<ThemeToken, (typeof PROFILE_THEME_OPTIONS)[number]>;

export const ACCEPTED_AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
