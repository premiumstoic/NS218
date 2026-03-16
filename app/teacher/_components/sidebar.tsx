"use client";

import Link from "next/link";
import type { EditableWeek } from "@/components/forms/week-edit-form";

interface SidebarProps {
  weeks: EditableWeek[];
  selectedId: string | null;
  onNewWeek: () => void;
}

export function Sidebar({ weeks, selectedId, onNewWeek }: SidebarProps) {
  const active = weeks.filter((w) => !w.archived_at);
  const archived = weeks.filter((w) => w.archived_at);

  return (
    <aside className="teacher-sidebar">
      <div className="teacher-sidebar__header">
        <span className="teacher-sidebar__label">Weeks</span>
      </div>

      <nav className="teacher-sidebar__nav">
        {active.map((week) => (
          <SidebarWeekItem key={week.id} week={week} selected={week.id === selectedId} />
        ))}

        {archived.length > 0 && (
          <>
            <div className="teacher-sidebar__divider">Archived</div>
            {archived.map((week) => (
              <SidebarWeekItem key={week.id} week={week} selected={week.id === selectedId} />
            ))}
          </>
        )}
      </nav>

      <div className="teacher-sidebar__footer">
        <button className="secondary" style={{ width: "100%" }} onClick={onNewWeek}>
          + New week
        </button>
      </div>
    </aside>
  );
}

function SidebarWeekItem({ week, selected }: { week: EditableWeek; selected: boolean }) {
  return (
    <Link
      href={`/teacher?week=${week.id}`}
      className={`teacher-sidebar__item${selected ? " teacher-sidebar__item--active" : ""}${week.archived_at ? " teacher-sidebar__item--archived" : ""}`}
    >
      <span className="teacher-sidebar__item-index">W{week.week_index}</span>
      <span className="teacher-sidebar__item-title">{week.title}</span>
      <span className="teacher-sidebar__item-badges">
        {week.is_exam_week && <span className="badge">Exam</span>}
        {!week.archived_at && (
          <span
            className="teacher-sidebar__dot"
            style={{ background: week.published ? "var(--accent)" : "var(--line)" }}
            title={week.published ? "Published" : "Draft"}
          />
        )}
      </span>
    </Link>
  );
}
