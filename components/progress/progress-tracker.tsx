"use client";

import { useEffect, useState } from "react";
import "./progress-tracker.css";

interface ProgressTrackerProps {
  weekId: string;
  contentItemId: string;
  onProgressUpdate?: (progress: number) => void;
}

export function ProgressTracker({ weekId, contentItemId, onProgressUpdate }: ProgressTrackerProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if this item is already marked complete
  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch(`/api/progress?week_id=${weekId}`);
        if (!response.ok) return;

        const data = await response.json();
        setIsCompleted(data.completed_item_ids.includes(contentItemId));
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      } finally {
        setIsFetching(false);
      }
    }

    fetchProgress();
  }, [weekId, contentItemId]);

  async function toggleComplete() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_item_id: contentItemId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update progress");
      }

      const data = await response.json();
      setIsCompleted(true);
      onProgressUpdate?.(data.progress_percentage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return null;
  }

  if (error) {
    return <p className="progress-error">Error: {error}</p>;
  }

  return (
    <div className="progress-tracker">
      <button
        onClick={toggleComplete}
        disabled={isLoading || isCompleted}
        className={`progress-button ${isCompleted ? "completed" : ""}`}
        title={isCompleted ? "Marked as complete" : "Mark as complete"}
      >
        {isCompleted ? "✓ Completed" : isLoading ? "Saving..." : "Mark complete"}
      </button>
    </div>
  );
}
