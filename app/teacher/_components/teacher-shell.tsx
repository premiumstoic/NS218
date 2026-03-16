"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { WeekPane } from "./week-pane";
import { TeacherDrawer } from "./teacher-drawer";
import { WeekEditorForm } from "@/components/forms/week-editor-form";
import { WeekEditForm } from "@/components/forms/week-edit-form";
import { ContentEditorForm } from "@/components/forms/content-editor-form";
import { ContentEditForm } from "@/components/forms/content-edit-form";
import type { EditableWeek } from "@/components/forms/week-edit-form";
import type { EditableContent } from "@/components/forms/content-edit-form";
import type { QuizQuestion, QuizOption, Flashcard, UploadStatus } from "@/lib/types";

type DrawerMode =
  | { kind: "new-week" }
  | { kind: "edit-week"; week: EditableWeek }
  | { kind: "new-content" }
  | { kind: "edit-content"; item: EditableContent };

interface WeekUpload {
  id: string;
  title: string;
  status: UploadStatus;
  mime_type: string;
  created_at: string;
}

interface TeacherShellProps {
  weeks: EditableWeek[];
  selectedWeek: EditableWeek | null;
  content: EditableContent[];
  uploads: WeekUpload[];
  questionsByContentId: Record<string, (QuizQuestion & { options: QuizOption[] })[]>;
  flashcardsByContentId: Record<string, Flashcard[]>;
}

export function TeacherShell({
  weeks,
  selectedWeek,
  content,
  uploads,
  questionsByContentId,
  flashcardsByContentId,
}: TeacherShellProps) {
  const [drawer, setDrawer] = useState<DrawerMode | null>(null);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const weekOptions = weeks
    .filter((w) => !w.archived_at)
    .map((w) => ({ id: w.id, week_index: w.week_index, title: w.title }));

  const drawerTitle = drawer
    ? drawer.kind === "new-week" ? "New week"
    : drawer.kind === "edit-week" ? `Edit: Week ${drawer.week.week_index}`
    : drawer.kind === "new-content" ? "Add content"
    : `Edit: ${(drawer as { kind: "edit-content"; item: EditableContent }).item.title}`
    : "";

  return (
    <div className="teacher-layout">
      <Sidebar
        weeks={weeks}
        selectedId={selectedWeek?.id ?? null}
        onNewWeek={() => setDrawer({ kind: "new-week" })}
      />

      <div className="teacher-layout__main">
        {selectedWeek ? (
          <WeekPane
            week={selectedWeek}
            content={content}
            uploads={uploads}
            onAddContent={() => setDrawer({ kind: "new-content" })}
            onEditContent={(item) => setDrawer({ kind: "edit-content", item })}
            onEditWeek={() => setDrawer({ kind: "edit-week", week: selectedWeek })}
          />
        ) : (
          <div className="teacher-pane teacher-pane--empty">
            <p className="subtle">Select a week from the sidebar, or create your first week.</p>
            <button onClick={() => setDrawer({ kind: "new-week" })}>+ New week</button>
          </div>
        )}
      </div>

      <TeacherDrawer open={drawer !== null} title={drawerTitle} onClose={closeDrawer}>
        {drawer?.kind === "new-week" && (
          <WeekEditorForm onSuccess={closeDrawer} />
        )}
        {drawer?.kind === "edit-week" && (
          <WeekEditForm week={drawer.week} onSuccess={closeDrawer} />
        )}
        {drawer?.kind === "new-content" && selectedWeek && (
          <ContentEditorForm weeks={weekOptions} defaultWeekId={selectedWeek.id} onSuccess={closeDrawer} />
        )}
        {drawer?.kind === "edit-content" && (
          <ContentEditForm
            content={drawer.item}
            initialQuestions={
              drawer.item.type === "quiz"
                ? questionsByContentId[drawer.item.id]
                : undefined
            }
            initialFlashcards={
              drawer.item.type === "flashcards"
                ? flashcardsByContentId[drawer.item.id]
                : undefined
            }
            onSuccess={closeDrawer}
          />
        )}
      </TeacherDrawer>
    </div>
  );
}
