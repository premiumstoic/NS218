"use client";

import { useState } from "react";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  order_index: number;
};

interface FlashcardDeckProps {
  flashcards: Flashcard[];
}

export function FlashcardDeck({ flashcards }: FlashcardDeckProps) {
  const sorted = [...flashcards].sort((a, b) => a.order_index - b.order_index);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  if (sorted.length === 0) {
    return <p className="subtle">No flashcards yet.</p>;
  }

  const card = sorted[index];

  return (
    <div className="grid">
      <div className="card" style={{ minHeight: "180px", display: "grid", placeContent: "center" }}>
        <p style={{ fontSize: "1.1rem", textAlign: "center" }}>{showBack ? card.back : card.front}</p>
      </div>
      <div className="row">
        <button className="secondary" onClick={() => setIndex((prev) => Math.max(0, prev - 1))} disabled={index === 0}>
          Previous
        </button>
        <button onClick={() => setShowBack((prev) => !prev)}>{showBack ? "Show Front" : "Show Back"}</button>
        <button
          className="secondary"
          onClick={() => setIndex((prev) => Math.min(sorted.length - 1, prev + 1))}
          disabled={index === sorted.length - 1}
        >
          Next
        </button>
      </div>
      <p className="subtle">
        Card {index + 1} / {sorted.length}
      </p>
    </div>
  );
}
