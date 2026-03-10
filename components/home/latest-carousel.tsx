"use client";

import { useEffect, useMemo, useState } from "react";

export type LatestCarouselItem = {
  id: string;
  kind: "content" | "upload";
  title: string;
  href: string;
  weekLabel: string;
  timestamp: string;
  kindLabel: string;
};

interface LatestCarouselProps {
  items: LatestCarouselItem[];
}

export function LatestCarousel({ items }: LatestCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const safeIndex = useMemo(() => {
    if (items.length === 0) {
      return 0;
    }
    return index % items.length;
  }, [index, items.length]);

  useEffect(() => {
    if (items.length <= 1 || paused) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  useEffect(() => {
    if (safeIndex >= items.length) {
      setIndex(0);
    }
  }, [items.length, safeIndex]);

  if (items.length === 0) {
    return (
      <section className="card">
        <h2 className="section-title">Latest from Class</h2>
        <p className="subtle">No published items yet.</p>
      </section>
    );
  }

  const active = items[safeIndex];

  function goPrev() {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  }

  function goNext() {
    setIndex((prev) => (prev + 1) % items.length);
  }

  return (
    <section
      className="card latest-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="row" style={{ alignItems: "flex-start" }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          Latest from Class
        </h2>
        <span className="badge">{active.kindLabel}</span>
      </div>

      <article className="latest-slide">
        <p className="subtle" style={{ marginBottom: "0.4rem" }}>
          {active.weekLabel}
        </p>
        <h3 style={{ marginTop: 0, marginBottom: "0.55rem" }}>{active.title}</h3>
        <p className="subtle" style={{ marginTop: 0 }}>
          {new Date(active.timestamp).toLocaleString()}
        </p>
        <a className="button" href={active.href}>
          Open
        </a>
      </article>

      <div className="carousel-controls" role="group" aria-label="Latest items navigation">
        <button type="button" className="secondary" onClick={goPrev} aria-label="Previous item">
          Prev
        </button>
        <div className="carousel-dots">
          {items.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              className={itemIndex === safeIndex ? "carousel-dot active" : "carousel-dot"}
              onClick={() => setIndex(itemIndex)}
              aria-label={`Go to item ${itemIndex + 1}`}
            />
          ))}
        </div>
        <button type="button" className="secondary" onClick={goNext} aria-label="Next item">
          Next
        </button>
      </div>
    </section>
  );
}
