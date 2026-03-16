"use client";

import type { Flashcard } from "@/lib/types";

export interface DraftCard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardBuilderProps {
  value: DraftCard[];
  onChange: (cards: DraftCard[]) => void;
  errors?: FlashcardBuilderErrors;
}

export interface FlashcardBuilderErrors {
  [cardId: string]: { front?: string; back?: string };
}

export function newCard(): DraftCard {
  return { id: crypto.randomUUID(), front: "", back: "" };
}

/** Convert builder state → API payload shape */
export function toApiFlashcards(cards: DraftCard[]) {
  return cards.map((c, i) => ({
    front: c.front,
    back: c.back,
    order_index: i,
  }));
}

/** Validate builder state, returns errors object (empty = valid) */
export function validateCards(cards: DraftCard[]): FlashcardBuilderErrors {
  const errors: FlashcardBuilderErrors = {};
  for (const c of cards) {
    const cardErrors: FlashcardBuilderErrors[string] = {};
    if (!c.front.trim()) cardErrors.front = "Front is required";
    if (!c.back.trim()) cardErrors.back = "Back is required";
    if (Object.keys(cardErrors).length > 0) errors[c.id] = cardErrors;
  }
  return errors;
}

/** Convert DB flashcards → draft shape */
export function toDraftCards(cards: Flashcard[]): DraftCard[] {
  return cards
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((c) => ({ id: c.id, front: c.front, back: c.back }));
}

export function FlashcardBuilder({ value, onChange, errors = {} }: FlashcardBuilderProps) {
  function updateCard(id: string, patch: Partial<DraftCard>) {
    onChange(value.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeCard(id: string) {
    onChange(value.filter((c) => c.id !== id));
  }

  function moveCard(index: number, direction: -1 | 1) {
    const next = [...value];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addCard() {
    onChange([...value, newCard()]);
  }

  return (
    <div className="quiz-builder">
      {value.length === 0 && (
        <p className="subtle" style={{ textAlign: "center", padding: "1rem 0" }}>
          No cards yet. Click &ldquo;Add card&rdquo; to start.
        </p>
      )}

      {value.map((card, i) => {
        const cardErrors = errors[card.id] ?? {};
        const hasError = Object.keys(cardErrors).length > 0;

        return (
          <div
            key={card.id}
            className={`quiz-builder__question${hasError ? " quiz-builder__question--error" : ""}`}
          >
            <div className="quiz-builder__question-header">
              <span className="quiz-builder__question-number">Card {i + 1}</span>
              <div className="quiz-builder__question-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => moveCard(i, -1)}
                  disabled={i === 0}
                  aria-label="Move card up"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => moveCard(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Move card down"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  onClick={() => removeCard(card.id)}
                  aria-label="Remove card"
                  title="Remove card"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flashcard-builder__sides">
              <label>
                Front
                <textarea
                  value={card.front}
                  onChange={(e) => updateCard(card.id, { front: e.target.value })}
                  rows={2}
                  placeholder="Question or term"
                  className={cardErrors.front ? "input--error" : undefined}
                />
                {cardErrors.front && <span className="field-error">{cardErrors.front}</span>}
              </label>
              <label>
                Back
                <textarea
                  value={card.back}
                  onChange={(e) => updateCard(card.id, { back: e.target.value })}
                  rows={2}
                  placeholder="Answer or definition"
                  className={cardErrors.back ? "input--error" : undefined}
                />
                {cardErrors.back && <span className="field-error">{cardErrors.back}</span>}
              </label>
            </div>
          </div>
        );
      })}

      <button type="button" className="secondary" onClick={addCard}>
        + Add card
      </button>
    </div>
  );
}
