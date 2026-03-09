"use client";

import { useState } from "react";

export function UploadStatusToggle({
  uploadId,
  initialStatus
}: {
  uploadId: string;
  initialStatus: "published" | "hidden";
}) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = status === "published" ? "hidden" : "published";

    const response = await fetch(`/api/teacher/uploads/${uploadId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: next })
    });

    if (response.ok) {
      setStatus(next);
    }

    setLoading(false);
  }

  return (
    <button className="secondary" onClick={toggle} disabled={loading}>
      {loading ? "Updating..." : status === "published" ? "Hide" : "Publish"}
    </button>
  );
}
