"use client";

import { useState } from "react";
import "./flashcard-deck.css";

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
  const [isFlipping, setIsFlipping] = useState(false);

  if (sorted.length === 0) {
    return <p className="subtle">No flashcards yet.</p>;
  }

  const card = sorted[index];

  function handleFlip() {
    setIsFlipping(true);
    setTimeout(() => {
      setShowBack((prev) => !prev);
      setIsFlipping(false);
    }, 300);
  }

  return (
    <div className="grid">
      <div className={`flashcard-container ${isFlipping ? "flipping" : ""}`}>
        <div className="flashcard">
          <p className="flashcard-text">{showBack ? card.back : card.front}</p>
        </div>
      </div>
      <div className="row">
        <button className="secondary" onClick={() => setIndex((prev) => Math.max(0, prev - 1))} disabled={index === 0}>
          Previous
        </button>
        <button onClick={handleFlip} disabled={isFlipping}>
          {showBack ? "Show Front" : "Show Back"}
        </button>
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
