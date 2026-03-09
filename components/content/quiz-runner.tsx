"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type QuizOption = {
  id: string;
  text: string;
  order_index: number;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  question_type: "single_choice" | "multiple_choice";
  explanation: string | null;
  order_index: number;
  quiz_options: QuizOption[];
};

type Attempt = {
  id: string;
  score: number;
  submitted_at: string;
};

interface QuizRunnerProps {
  contentId: string;
  questions: QuizQuestion[];
  canAttempt: boolean;
}

export function QuizRunner({ contentId, questions, canAttempt }: QuizRunnerProps) {
  const orderedQuestions = useMemo(() => [...questions].sort((a, b) => a.order_index - b.order_index), [questions]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<{
    score: number;
    totalQuestions: number;
    correctCount: number;
    feedback: Record<string, { isCorrect: boolean; explanation: string | null }>;
  } | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canAttempt) {
      return;
    }

    fetch(`/api/quizzes/${contentId}/attempts/me`)
      .then(async (response) => {
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        setAttempts(payload.attempts ?? []);
      })
      .catch(() => {
        // ignore background fetch failures
      });
  }, [canAttempt, contentId]);

  function selectSingle(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: [optionId] }));
  }

  function toggleMultiple(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const current = new Set(prev[questionId] ?? []);
      if (current.has(optionId)) {
        current.delete(optionId);
      } else {
        current.add(optionId);
      }
      return { ...prev, [questionId]: [...current] };
    });
  }

  async function submitAttempt(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/quizzes/${contentId}/attempts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ answers })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Could not submit attempt");
      setLoading(false);
      return;
    }

    setResult(payload.result);
    setAttempts((prev) => [payload.attempt, ...prev]);
    setLoading(false);
  }

  return (
    <div className="grid">
      {canAttempt ? null : <p className="subtle">Login to submit attempts. Public users can still review questions.</p>}

      <form className="grid" onSubmit={submitAttempt}>
        {orderedQuestions.map((question) => (
          <article key={question.id} className="card" style={{ background: "var(--surface-soft)" }}>
            <p>
              <strong>{question.prompt}</strong>
            </p>
            <div className="grid">
              {[...question.quiz_options]
                .sort((a, b) => a.order_index - b.order_index)
                .map((option) => {
                  const selected = (answers[question.id] ?? []).includes(option.id);

                  if (question.question_type === "single_choice") {
                    return (
                      <label key={option.id}>
                        <input
                          type="radio"
                          name={question.id}
                          checked={selected}
                          onChange={() => selectSingle(question.id, option.id)}
                        />
                        {option.text}
                      </label>
                    );
                  }

                  return (
                    <label key={option.id}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleMultiple(question.id, option.id)}
                      />
                      {option.text}
                    </label>
                  );
                })}
            </div>

            {result?.feedback[question.id] ? (
              <p style={{ color: result.feedback[question.id].isCorrect ? "var(--accent-strong)" : "var(--danger)" }}>
                {result.feedback[question.id].isCorrect ? "Correct" : "Not correct"}
                {result.feedback[question.id].explanation ? ` - ${result.feedback[question.id].explanation}` : ""}
              </p>
            ) : null}
          </article>
        ))}

        {canAttempt ? <button disabled={loading}>{loading ? "Scoring..." : "Submit attempt"}</button> : null}
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      </form>

      {result ? (
        <section className="card">
          <h3 className="section-title">Attempt Result</h3>
          <p>
            Score: <strong>{result.score}%</strong> ({result.correctCount}/{result.totalQuestions})
          </p>
          <button className="secondary" onClick={() => setResult(null)}>
            New practice round
          </button>
        </section>
      ) : null}

      {canAttempt ? (
        <section className="card">
          <h3 className="section-title">My Recent Attempts</h3>
          {attempts.length === 0 ? <p className="subtle">No attempts yet.</p> : null}
          <ul>
            {attempts.slice(0, 10).map((attempt) => (
              <li key={attempt.id}>
                {new Date(attempt.submitted_at).toLocaleString()} - {attempt.score}%
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
