import { BindingCurveSimulation } from "@/components/simulations/binding-curve";
import { RandomWalkSimulation } from "@/components/simulations/random-walk";

interface SimulationViewerProps {
  body: string | null;
}

type SimulationConfig =
  | { kind: "embed"; url: string }
  | { kind: "random-walk" }
  | { kind: "binding-curve" };

function parseConfig(body: string | null): SimulationConfig | null {
  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body);
  } catch {
    if (body.startsWith("http://") || body.startsWith("https://")) {
      return { kind: "embed", url: body };
    }
    return null;
  }
}

export function SimulationViewer({ body }: SimulationViewerProps) {
  const config = parseConfig(body);

  if (!config) {
    return (
      <div className="card">
        <p className="subtle">No valid simulation config provided. Use JSON body like:</p>
        <pre>{`{"kind":"embed","url":"https://..."}`}</pre>
      </div>
    );
  }

  if (config.kind === "embed") {
    return (
      <section className="card">
        <h3 className="section-title">Embedded Simulation</h3>
        <div style={{ aspectRatio: "16/9", border: "1px solid var(--line)", borderRadius: "10px", overflow: "hidden" }}>
          <iframe title="Simulation" src={config.url} width="100%" height="100%" style={{ border: 0 }} />
        </div>
        <p className="subtle">
          If embedding is blocked by provider policy, open directly: <a href={config.url}>{config.url}</a>
        </p>
      </section>
    );
  }

  if (config.kind === "random-walk") {
    return <RandomWalkSimulation />;
  }

  return <BindingCurveSimulation />;
}
