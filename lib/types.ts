export type Role = "teacher" | "student";
export type ThemeToken = "sage" | "ocean" | "amber" | "rose" | "slate";

export type ContentType =
  | "note"
  | "flashcards"
  | "quiz"
  | "simulation"
  | "resource";

export type UploadStatus = "published" | "hidden";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: Role;
  avatar_url: string | null;
  theme_token: ThemeToken;
  created_at: string;
}

export interface Week {
  id: string;
  course_code: string;
  week_index: number;
  title: string;
  act: string | null;
  start_date: string;
  is_exam_week: boolean;
  published: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
}

export interface ContentItem {
  id: string;
  week_id: string;
  type: ContentType;
  title: string;
  body: string | null;
  published_at: string | null;
  created_by: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  author_id: string;
  target_type: "week" | "content_item" | "upload";
  target_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Upload {
  id: string;
  week_id: string;
  uploader_id: string;
  title: string;
  file_url: string;
  mime_type: string;
  status: UploadStatus;
  created_at: string;
}

export interface Flashcard {
  id: string;
  content_item_id: string;
  front: string;
  back: string;
  order_index: number;
}

export interface QuizQuestion {
  id: string;
  content_item_id: string;
  prompt: string;
  question_type: "single_choice" | "multiple_choice";
  explanation: string | null;
  order_index: number;
}

export interface QuizOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  content_item_id: string;
  user_id: string;
  score: number;
  answers: Record<string, string[]>;
  feedback: Record<string, { isCorrect: boolean; explanation: string | null }>;
  started_at: string;
  submitted_at: string;
}
