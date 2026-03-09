"use client";

import { useMemo, useState } from "react";

function singleWalk(steps: number): number {
  let x = 0;
  for (let i = 0; i < steps; i += 1) {
    x += Math.random() > 0.5 ? 1 : -1;
  }
  return x;
}

export function RandomWalkSimulation() {
  const [steps, setSteps] = useState(100);
  const [trials, setTrials] = useState(300);

  const stats = useMemo(() => {
    const values = Array.from({ length: trials }, () => singleWalk(steps));
    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const meanSquare = values.reduce((acc, value) => acc + value ** 2, 0) / values.length;
    const rms = Math.sqrt(meanSquare);

    return {
      mean: mean.toFixed(2),
      rms: rms.toFixed(2)
    };
  }, [steps, trials]);

  return (
    <section className="card">
      <h3 className="section-title">Built-in Simulation: 1D Random Walk</h3>
      <p className="subtle">Observe how RMS displacement grows with the square root of step count.</p>

      <label>
        Steps: {steps}
        <input type="range" min={10} max={1000} step={10} value={steps} onChange={(e) => setSteps(Number(e.target.value))} />
      </label>

      <label>
        Trials: {trials}
        <input
          type="range"
          min={50}
          max={1000}
          step={10}
          value={trials}
          onChange={(e) => setTrials(Number(e.target.value))}
        />
      </label>

      <p>
        Mean endpoint: <strong>{stats.mean}</strong>
      </p>
      <p>
        RMS displacement: <strong>{stats.rms}</strong>
      </p>
    </section>
  );
}
