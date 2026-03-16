"use client";

import { useEffect, useRef } from "react";

interface TeacherDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function TeacherDrawer({ open, title, onClose, children }: TeacherDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`drawer-backdrop${open ? " drawer-backdrop--open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`drawer-panel${open ? " drawer-panel--open" : ""}`}
      >
        <div className="drawer-header">
          <h2 className="drawer-title">{title}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>
        <div className="drawer-body">
          {children}
        </div>
      </div>
    </>
  );
}
