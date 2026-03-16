"use client";

import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { UploadStatusToggle } from "@/components/forms/upload-status-toggle";
import type { EditableWeek } from "@/components/forms/week-edit-form";
import type { EditableContent } from "@/components/forms/content-edit-form";
import type { UploadStatus } from "@/lib/types";

const CONTENT_TYPE_ICONS: Record<string, string> = {
  note: "📄",
  flashcards: "🃏",
  quiz: "📝",
  simulation: "🔬",
  resource: "🔗",
};

interface WeekUpload {
  id: string;
  title: string;
  status: UploadStatus;
  mime_type: string;
  created_at: string;
}

interface WeekPaneProps {
  week: EditableWeek;
  content: EditableContent[];
  uploads: WeekUpload[];
  onAddContent: () => void;
  onEditContent: (item: EditableContent) => void;
  onEditWeek: () => void;
}

export function WeekPane({
  week,
  content,
  uploads,
  onAddContent,
  onEditContent,
  onEditWeek,
}: WeekPaneProps) {
  return (
    <div className="teacher-pane">
      {/* Week header */}
      <div className="teacher-pane__header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="teacher-pane__week-meta">
            <span className="badge">Week {week.week_index}</span>
            {week.act && <span className="subtle">{week.act}</span>}
            {week.is_exam_week && <span className="badge">Exam</span>}
            <span
              className="badge"
              style={week.published
                ? { background: "var(--badge-bg)", color: "var(--accent-strong)" }
                : { background: "var(--surface-soft)", color: "var(--ink-muted)" }
              }
            >
              {week.published ? "Published" : "Draft"}
            </span>
            {week.archived_at && <span className="badge" style={{ background: "#fef3c7", color: "#92400e" }}>Archived</span>}
          </div>
          <h1 className="teacher-pane__title">{week.title}</h1>
          {week.start_date && (
            <p className="subtle" style={{ margin: 0 }}>
              {new Date(week.start_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>
        <div className="teacher-pane__header-actions">
          <button className="secondary" onClick={onEditWeek}>Edit week</button>
        </div>
      </div>

      {/* Content items */}
      <section className="teacher-pane__section">
        <div className="teacher-pane__section-header">
          <h2 className="section-title" style={{ margin: 0 }}>Content</h2>
          <button onClick={onAddContent}>+ Add content</button>
        </div>

        {content.length === 0 ? (
          <p className="subtle">No content yet. Add a note, quiz, or flashcard deck.</p>
        ) : (
          <div className="teacher-pane__content-list">
            {content.map((item) => (
              <ContentRow key={item.id} item={item} onEdit={() => onEditContent(item)} />
            ))}
          </div>
        )}
      </section>

      {/* Uploads */}
      <section className="teacher-pane__section">
        <div className="teacher-pane__section-header">
          <h2 className="section-title" style={{ margin: 0 }}>
            Uploads {uploads.length > 0 && <span className="subtle">({uploads.length})</span>}
          </h2>
        </div>

        {uploads.length === 0 ? (
          <p className="subtle">No student uploads for this week.</p>
        ) : (
          <div className="teacher-pane__upload-list">
            {uploads.map((upload) => (
              <UploadRow key={upload.id} upload={upload} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ContentRow({ item, onEdit }: { item: EditableContent; onEdit: () => void }) {
  const icon = CONTENT_TYPE_ICONS[item.type] ?? "📄";
  const label = CONTENT_TYPE_LABELS[item.type];

  return (
    <div className="teacher-content-row">
      <span className="teacher-content-row__icon" aria-hidden="true">{icon}</span>
      <div className="teacher-content-row__info">
        <span className="teacher-content-row__title">{item.title}</span>
        <span className="subtle">{label}</span>
      </div>
      <span
        className="badge"
        style={item.published_at
          ? { background: "var(--badge-bg)", color: "var(--accent-strong)" }
          : { background: "var(--surface-soft)", color: "var(--ink-muted)" }
        }
      >
        {item.published_at ? "Published" : "Draft"}
      </span>
      <button className="secondary" onClick={onEdit}>Edit</button>
    </div>
  );
}

function UploadRow({ upload }: { upload: WeekUpload }) {
  return (
    <div className="teacher-upload-row">
      <div className="teacher-upload-row__info">
        <span className="teacher-upload-row__title">{upload.title}</span>
        <span className="subtle">{new Date(upload.created_at).toLocaleDateString()}</span>
      </div>
      <span
        className="badge"
        style={upload.status === "published"
          ? { background: "var(--badge-bg)", color: "var(--accent-strong)" }
          : { background: "var(--surface-soft)", color: "var(--ink-muted)" }
        }
      >
        {upload.status}
      </span>
      <UploadStatusToggle uploadId={upload.id} initialStatus={upload.status} />
    </div>
  );
}
