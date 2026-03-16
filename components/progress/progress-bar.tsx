"use client";

import "./progress-bar.css";

interface ProgressBarProps {
  completedCount: number;
  totalCount: number;
  label?: string;
}

export function ProgressBar({ completedCount, totalCount, label = "Week Progress" }: ProgressBarProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-header">
        <span className="progress-label">{label}</span>
        <span className="progress-stats">{completedCount} / {totalCount} items</span>
      </div>
      <div className="progress-bar-wrapper">
        <div className="progress-bar-background">
          <div
            className="progress-bar-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="progress-percentage">{percentage}%</span>
      </div>
    </div>
  );
}
