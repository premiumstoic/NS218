"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
}

export default function StatCard({ label, value, unit, trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <div className="stat-value-container">
        <span className="stat-value">{value}</span>
        {unit && <span className="stat-unit">{unit}</span>}
        {trend && (
          <span className={`stat-trend ${trend}`}>
            {trend === "up" && "↑"}
            {trend === "down" && "↓"}
            {trend === "neutral" && "→"}
          </span>
        )}
      </div>
    </div>
  );
}
