"use client";

import { useMemo, useState } from "react";

export function BindingCurveSimulation() {
  const [kd, setKd] = useState(1);
  const [ligand, setLigand] = useState(1);

  const theta = useMemo(() => ligand / (ligand + kd), [ligand, kd]);

  return (
    <section className="card">
      <h3 className="section-title">Built-in Simulation: Langmuir Binding Curve</h3>
      <p className="subtle">Coverage fraction theta = [L] / ([L] + Kd)</p>

      <label>
        Kd: {kd.toFixed(2)}
        <input type="range" min={0.1} max={20} step={0.1} value={kd} onChange={(e) => setKd(Number(e.target.value))} />
      </label>

      <label>
        Ligand concentration [L]: {ligand.toFixed(2)}
        <input
          type="range"
          min={0.1}
          max={20}
          step={0.1}
          value={ligand}
          onChange={(e) => setLigand(Number(e.target.value))}
        />
      </label>

      <p>
        Surface coverage theta: <strong>{theta.toFixed(3)}</strong>
      </p>
    </section>
  );
}
