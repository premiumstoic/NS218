"use client";

import { useId } from "react";

export interface DraftOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface DraftQuestion {
  id: string;
  prompt: string;
  question_type: "single_choice" | "multiple_choice";
  explanation: string;
  options: DraftOption[];
}

export interface QuizBuilderProps {
  value: DraftQuestion[];
  onChange: (questions: DraftQuestion[]) => void;
  errors?: QuizBuilderErrors;
}

export interface QuizBuilderErrors {
  [questionId: string]: {
    prompt?: string;
    options?: string;
    correct?: string;
    optionTexts?: { [optionId: string]: string };
  };
}

function newOption(): DraftOption {
  return { id: crypto.randomUUID(), text: "", is_correct: false };
}

export function newQuestion(): DraftQuestion {
  return {
    id: crypto.randomUUID(),
    prompt: "",
    question_type: "single_choice",
    explanation: "",
    options: [newOption(), newOption()],
  };
}

/** Convert builder state → API payload shape (strip local ids, assign order_index) */
export function toApiQuestions(questions: DraftQuestion[]) {
  return questions.map((q, qi) => ({
    prompt: q.prompt,
    question_type: q.question_type,
    explanation: q.explanation.trim() || null,
    order_index: qi,
    options: q.options.map((o, oi) => ({
      text: o.text,
      is_correct: o.is_correct,
      order_index: oi,
    })),
  }));
}

/** Validate builder state, returns errors object (empty = valid) */
export function validateQuestions(questions: DraftQuestion[]): QuizBuilderErrors {
  const errors: QuizBuilderErrors = {};

  for (const q of questions) {
    const qErrors: QuizBuilderErrors[string] = {};
    const optionTextErrors: { [id: string]: string } = {};

    if (!q.prompt.trim()) {
      qErrors.prompt = "Question prompt is required";
    }

    if (q.options.length < 2) {
      qErrors.options = "Add at least 2 options";
    }

    for (const o of q.options) {
      if (!o.text.trim()) {
        optionTextErrors[o.id] = "Option text cannot be empty";
      }
    }
    if (Object.keys(optionTextErrors).length > 0) {
      qErrors.optionTexts = optionTextErrors;
    }

    const correctCount = q.options.filter((o) => o.is_correct).length;
    if (q.question_type === "single_choice" && correctCount !== 1) {
      qErrors.correct = "Mark exactly one correct answer";
    } else if (q.question_type === "multiple_choice" && correctCount < 1) {
      qErrors.correct = "Mark at least one correct answer";
    }

    if (Object.keys(qErrors).length > 0) {
      errors[q.id] = qErrors;
    }
  }

  return errors;
}

export function QuizBuilder({ value, onChange, errors = {} }: QuizBuilderProps) {
  const uid = useId();

  function updateQuestion(id: string, patch: Partial<DraftQuestion>) {
    onChange(value.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function removeQuestion(id: string) {
    onChange(value.filter((q) => q.id !== id));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const next = [...value];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addQuestion() {
    onChange([...value, newQuestion()]);
  }

  function updateOption(qId: string, oId: string, patch: Partial<DraftOption>) {
    const q = value.find((q) => q.id === qId);
    if (!q) return;
    updateQuestion(qId, {
      options: q.options.map((o) => (o.id === oId ? { ...o, ...patch } : o)),
    });
  }

  function setCorrect(qId: string, oId: string, checked: boolean) {
    const q = value.find((q) => q.id === qId);
    if (!q) return;
    if (q.question_type === "single_choice") {
      updateQuestion(qId, {
        options: q.options.map((o) => ({ ...o, is_correct: o.id === oId })),
      });
    } else {
      updateOption(qId, oId, { is_correct: checked });
    }
  }

  function addOption(qId: string) {
    const q = value.find((q) => q.id === qId);
    if (!q) return;
    updateQuestion(qId, { options: [...q.options, newOption()] });
  }

  function removeOption(qId: string, oId: string) {
    const q = value.find((q) => q.id === qId);
    if (!q) return;
    updateQuestion(qId, { options: q.options.filter((o) => o.id !== oId) });
  }

  function changeQuestionType(qId: string, type: "single_choice" | "multiple_choice") {
    const q = value.find((q) => q.id === qId);
    if (!q) return;
    let options = q.options;
    if (type === "single_choice") {
      // Keep at most one correct answer when switching to single choice
      const firstCorrect = options.findIndex((o) => o.is_correct);
      options = options.map((o, i) => ({ ...o, is_correct: i === firstCorrect }));
    }
    updateQuestion(qId, { question_type: type, options });
  }

  return (
    <div className="quiz-builder">
      {value.length === 0 && (
        <p className="subtle" style={{ textAlign: "center", padding: "1rem 0" }}>
          No questions yet. Click &ldquo;Add question&rdquo; to start.
        </p>
      )}

      {value.map((q, qi) => {
        const qErrors = errors[q.id] ?? {};
        const hasError = Object.keys(qErrors).length > 0;

        return (
          <div
            key={q.id}
            className={`quiz-builder__question${hasError ? " quiz-builder__question--error" : ""}`}
          >
            {/* Question header */}
            <div className="quiz-builder__question-header">
              <span className="quiz-builder__question-number">Question {qi + 1}</span>
              <div className="quiz-builder__question-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => moveQuestion(qi, -1)}
                  disabled={qi === 0}
                  aria-label="Move question up"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => moveQuestion(qi, 1)}
                  disabled={qi === value.length - 1}
                  aria-label="Move question down"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  onClick={() => removeQuestion(q.id)}
                  aria-label="Remove question"
                  title="Remove question"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Question type selector */}
            <label>
              Type
              <select
                value={q.question_type}
                onChange={(e) => changeQuestionType(q.id, e.target.value as DraftQuestion["question_type"])}
              >
                <option value="single_choice">Single choice</option>
                <option value="multiple_choice">Multiple choice</option>
              </select>
            </label>

            {/* Prompt */}
            <label>
              Prompt
              <textarea
                id={`${uid}-q${qi}-prompt`}
                value={q.prompt}
                onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                rows={2}
                placeholder="e.g. Which quantity scales as √N in a random walk?"
                className={qErrors.prompt ? "input--error" : undefined}
              />
              {qErrors.prompt && <span className="field-error">{qErrors.prompt}</span>}
            </label>

            {/* Options */}
            <fieldset className="quiz-builder__options-fieldset">
              <legend>
                Options
                {(qErrors.options || qErrors.correct) && (
                  <span className="field-error" style={{ marginLeft: "0.5rem" }}>
                    {qErrors.options ?? qErrors.correct}
                  </span>
                )}
              </legend>

              {q.options.map((o, oi) => {
                const optError = qErrors.optionTexts?.[o.id];
                return (
                  <div key={o.id} className="quiz-builder__option-row">
                    {q.question_type === "single_choice" ? (
                      <input
                        type="radio"
                        name={`${uid}-q${qi}-correct`}
                        checked={o.is_correct}
                        onChange={() => setCorrect(q.id, o.id, true)}
                        aria-label={`Mark option ${oi + 1} as correct`}
                        title="Mark as correct"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={o.is_correct}
                        onChange={(e) => setCorrect(q.id, o.id, e.target.checked)}
                        aria-label={`Mark option ${oi + 1} as correct`}
                        title="Mark as correct"
                      />
                    )}
                    <input
                      type="text"
                      value={o.text}
                      onChange={(e) => updateOption(q.id, o.id, { text: e.target.value })}
                      placeholder={`Option ${oi + 1}`}
                      className={`quiz-builder__option-input${optError ? " input--error" : ""}`}
                    />
                    {optError && <span className="field-error">{optError}</span>}
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => removeOption(q.id, o.id)}
                      disabled={q.options.length <= 2}
                      aria-label={`Remove option ${oi + 1}`}
                      title="Remove option"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                className="secondary"
                style={{ marginTop: "0.5rem" }}
                onClick={() => addOption(q.id)}
              >
                + Add option
              </button>
            </fieldset>

            {/* Explanation */}
            <label>
              Explanation <span className="subtle">(shown to students after attempt)</span>
              <textarea
                value={q.explanation}
                onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                rows={2}
                placeholder="Optional: explain why the correct answer is right"
              />
            </label>
          </div>
        );
      })}

      <button type="button" className="secondary" onClick={addQuestion}>
        + Add question
      </button>
    </div>
  );
}
