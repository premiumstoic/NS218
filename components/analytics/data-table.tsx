"use client";
import type React from "react";

interface Column {
  key: string;
  label: string;
  format?: (value: React.ReactNode) => string;
  align?: "left" | "center" | "right";
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
  title?: string;
  emptyMessage?: string;
}

export default function DataTable({
  columns,
  rows,
  title,
  emptyMessage = "No data available",
}: DataTableProps) {
  return (
    <div className="data-table-container">
      {title && <h3 className="data-table-title">{title}</h3>}
      {rows.length === 0 ? (
        <p className="data-table-empty">{emptyMessage}</p>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={{ textAlign: col.align || "left" }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align || "left" }}>
                      {col.format ? col.format(row[col.key]) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
