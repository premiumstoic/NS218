"use client";

import { FormEvent, useMemo, useState } from "react";

type CommentRecord = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
    email: string | null;
  } | null;
};

interface CommentSectionClientProps {
  targetType: "week" | "content_item" | "upload";
  targetId: string;
  initialComments: CommentRecord[];
  currentUserId?: string;
  isTeacher?: boolean;
}

export function CommentSectionClient({
  targetType,
  targetId,
  initialComments,
  currentUserId,
  isTeacher
}: CommentSectionClientProps) {
  const [comments, setComments] = useState<CommentRecord[]>(initialComments);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...comments].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [comments]
  );

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        target_type: targetType,
        target_id: targetId,
        body: body.trim()
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to post comment");
      setLoading(false);
      return;
    }

    setComments((prev) => [...prev, payload.comment]);
    setBody("");
    setLoading(false);
  }

  async function deleteComment(commentId: string) {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    }
  }

  return (
    <section className="card">
      <h3 className="section-title">Discussion</h3>

      <div className="grid">
        {sorted.length === 0 ? <p className="subtle">No comments yet.</p> : null}
        {sorted.map((comment) => {
          const canDelete = Boolean(currentUserId && (currentUserId === comment.author_id || isTeacher));

          return (
            <article key={comment.id} className="card" style={{ background: "var(--surface-soft)" }}>
              <div className="row">
                <strong>{comment.profiles?.display_name ?? comment.profiles?.email ?? "Class member"}</strong>
                <span className="subtle">{new Date(comment.created_at).toLocaleString()}</span>
              </div>
              <p style={{ marginBottom: "0.5rem" }}>{comment.body}</p>
              {canDelete ? (
                <button className="secondary" onClick={() => deleteComment(comment.id)}>
                  Delete
                </button>
              ) : null}
            </article>
          );
        })}
      </div>

      {currentUserId ? (
        <form onSubmit={submitComment}>
          <label>
            Add a comment
            <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={3000} />
          </label>
          <button disabled={loading}>{loading ? "Posting..." : "Post comment"}</button>
          {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        </form>
      ) : (
        <p className="subtle">Login to join the discussion.</p>
      )}
    </section>
  );
}
