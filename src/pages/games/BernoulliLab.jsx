import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import SimCanvas from '@/components/lab/SimCanvas';
import ControlSlider from '@/components/lab/ControlSlider';
import Readout from '@/components/lab/Readout';
import GoalPanel from '@/components/lab/GoalPanel';
import { gameByKey } from '@/lib/games';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useGameSave } from '@/hooks/useGameSave';

const game = gameByKey('bernoulli');
const PATM = 101325; // Pa
const TOLERANCE = 200; // Pa

const FLUIDS = {
  water:   { rho: 1000,  label: 'Water' },
  oil:     { rho: 850,   label: 'Oil' },
  mercury: { rho: 13600, label: 'Mercury' },
  air:     { rho: 1.225, label: 'Air' },
};

const PRESETS = [
  { label: 'Garden hose', flow: 0.0005, d1: 0.02, d2: 0.01, fluid: 'water' },
  { label: 'Fire hose', flow: 0.005, d1: 0.075, d2: 0.025, fluid: 'water' },
  { label: 'HVAC duct', flow: 0.1, d1: 0.3, d2: 0.15, fluid: 'air' },
];

const randomTarget = () => Math.round(-50000 + Math.random() * 50000);

const compute = (flow, d1, d2, fluidKey) => {
  const rho = FLUIDS[fluidKey].rho;
  const A1 = Math.PI * (d1 / 2) ** 2;
  const A2 = Math.PI * (d2 / 2) ** 2;
  const v1 = flow / A1;
  const v2 = flow / A2;
  const P1 = PATM;
  const P2 = P1 + 0.5 * rho * (v1 * v1 - v2 * v2);
  const dP = P2 - P1;
  return { rho, A1, A2, v1, v2, P1, P2, dP };
};

export default function BernoulliLab() {
  const [flow, setFlow] = useState(0.001);
  const [d1, setD1] = useState(0.05);
  const [d2, setD2] = useState(0.02);
  const [fluid, setFluid] = useState('water');
  const [target, setTarget] = useState(randomTarget);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState(null);

  const colors = useThemeColors();
  const { save, reset: resetSave } = useGameSave();
  const sim = useRef({ flow, d1, d2, fluid, phase: 0 });

  useEffect(() => {
    sim.current.flow = flow;
    sim.current.d1 = d1;
    sim.current.d2 = d2;
    sim.current.fluid = fluid;
  }, [flow, d1, d2, fluid]);

  const result = compute(flow, d1, d2, fluid);

  const checkSolved = (dP) => {
    const miss = Math.abs(dP - target);
    if (miss > TOLERANCE) return;
    const score = Math.max(0, Math.round(100 - (miss / TOLERANCE) * 30));
    setOutcome({ dP, miss, score, solved: true });
    save(game, {
      score,
      summary: `ΔP = ${dP.toFixed(0)} Pa, v_throat = ${result.v2.toFixed(1)} m/s (${FLUIDS[fluid].label})`,
      playToken: `bernoulli-${attempt}-${target}`,
    });
  };

  const apply = () => {
    setAttempt((n) => n + 1);
    setOutcome(null);
    resetSave();
    checkSolved(result.dP);
  };

  const newTarget = () => {
    setTarget(randomTarget());
    setOutcome(null);
    resetSave();
  };

  const loadPreset = (p) => {
    setFlow(p.flow);
    setD1(p.d1);
    setD2(p.d2);
    setFluid(p.fluid);
    setOutcome(null);
    resetSave();
  };

  const step = (state, dt) => {
    state.phase = (state.phase + dt * 0.8) % 1;
  };

  const draw = (ctx, w, h, state) => {
    const res = compute(state.flow, state.d1, state.d2, state.fluid);
    const padX = 30;
    const pipeY = h * 0.38;
    const pipeW = w - padX * 2;
    const xStart = padX;
    const xEnd = w - padX;
    const maxR = (h * 0.28) / 2;
    const r1 = (state.d1 / 0.3) * maxR;
    const r2 = (state.d2 / 0.3) * maxR;

    const radiusAt = (x) => {
      const t = (x - xStart) / pipeW;
      if (t < 0.35) return r1;
      if (t < 0.5) return r1 + (r2 - r1) * ((t - 0.35) / 0.15);
      if (t < 0.65) return r2 + (r1 - r2) * ((t - 0.5) / 0.15);
      return r1;
    };

    // Pipe fill
    ctx.fillStyle = 'hsl(200 80% 55% / 0.12)';
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const x = xStart + (i / 60) * pipeW;
      const r = radiusAt(x);
      if (i === 0) ctx.moveTo(x, pipeY - r);
      else ctx.lineTo(x, pipeY - r);
    }
    for (let i = 60; i >= 0; i--) {
      const x = xStart + (i / 60) * pipeW;
      const r = radiusAt(x);
      ctx.lineTo(x, pipeY + r);
    }
    ctx.closePath();
    ctx.fill();

    // Pipe outline
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const x = xStart + (i / 60) * pipeW;
      const r = radiusAt(x);
      if (i === 0) ctx.moveTo(x, pipeY - r);
      else ctx.lineTo(x, pipeY - r);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const x = xStart + (i / 60) * pipeW;
      const r = radiusAt(x);
      if (i === 0) ctx.moveTo(x, pipeY + r);
      else ctx.lineTo(x, pipeY + r);
    }
    ctx.stroke();

    // Streamlines
    const lines = 5;
    for (let i = 0; i < lines; i++) {
      const yFrac = ((i + 0.5) / lines) * 2 - 1;
      ctx.strokeStyle = colors.physics;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let s = 0; s <= 60; s++) {
        const x = xStart + (s / 60) * pipeW;
        const r = radiusAt(x);
        const y = pipeY + yFrac * r * 0.85;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Flowing particles
    const particleCount = 35;
    for (let i = 0; i < particleCount; i++) {
      const t = ((i / particleCount) + state.phase) % 1;
      const x = xStart + t * pipeW;
      const r = radiusAt(x);
      const yFrac = ((i * 0.371) % 1) * 2 - 1;
      const y = pipeY + yFrac * r * 0.8;
      ctx.fillStyle = colors.physics;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Pressure gauges
    const gauges = [
      { x: xStart + 24, P: res.P1, label: 'P₁' },
      { x: w / 2, P: res.P2, label: 'P₂' },
      { x: xEnd - 24, P: res.P1, label: 'P₃' },
    ];
    const barH = 36;
    const barW = 10;
    const barY = pipeY + maxR + 14;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (const g of gauges) {
      ctx.fillStyle = colors.grid;
      ctx.fillRect(g.x - barW / 2, barY, barW, barH);
      const pFrac = Math.max(0, Math.min(1, (g.P - 80000) / 40000));
      ctx.fillStyle = g.P < PATM ? '#3b82f6' : colors.physics;
      ctx.fillRect(g.x - barW / 2, barY + barH * (1 - pFrac), barW, barH * pFrac);
      ctx.fillStyle = colors.ink;
      ctx.fillText(g.label, g.x, barY + barH + 14);
      ctx.fillStyle = colors.faint;
      ctx.fillText(`${(g.P / 1000).toFixed(1)} kPa`, g.x, barY + barH + 26);
    }
  };

  const status = outcome?.solved ? 'solved' : attempt > 0 ? 'active' : 'idle';
  const message = outcome
    ? `Pressure drop reads ${outcome.dP.toFixed(0)} Pa — ${outcome.miss.toFixed(0)} Pa ${
        outcome.dP < target ? 'under' : 'over'
      } the target.`
    : `The venturi shows live pressure. Tune flow, diameters and fluid to hit ${target} Pa.`;

  return (
    <GameShell game={game}>
      <div className="grid gap-6 landscape:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SimCanvas simRef={sim} step={step} draw={draw} className="h-[42vh] min-h-[240px] max-h-[440px]" />

          <Panel title="Live state" subtitle="Steady flow through a converging-diverging nozzle.">
            <Readout
              items={[
                { label: 'Throat ΔP', value: result.dP.toFixed(0), unit: 'Pa', tone: 'primary' },
                { label: 'Inlet v₁', value: result.v1.toFixed(2), unit: 'm/s' },
                { label: 'Throat v₂', value: result.v2.toFixed(1), unit: 'm/s' },
                { label: 'Throat P', value: (result.P2 / 1000).toFixed(1), unit: 'kPa' },
                { label: 'Target ΔP', value: target.toFixed(0), unit: 'Pa', tone: 'math' },
                { label: 'Attempts', value: `${attempt}` },
              ]}
            />
          </Panel>

          <Panel title="The physics" subtitle="Energy is conserved along a streamline.">
            <div className="space-y-3">
              <p className="formula">P + ½ρv² = constant</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Where the pipe narrows, the fluid speeds up — and the pressure drops. Bernoulli's
                equation is conservation of energy per unit volume: pressure energy trades into kinetic
                energy and back. A carburetor, a Venturi meter, an airplane wing and a fire hose nozzle
                all rely on the same swap. Squeeze the throat and watch the gauge fall.
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <GoalPanel
            goal={`Bring the throat pressure drop to ${target} Pa, within ${TOLERANCE} Pa.`}
            status={status}
            message={message}
            score={outcome?.score}
          >
            <Button onClick={apply}>
              <Play className="mr-2 h-4 w-4" />
              Apply
            </Button>
            <Button variant="outline" onClick={newTarget}>
              <RotateCcw className="mr-2 h-4 w-4" />
              New target
            </Button>
          </GoalPanel>

          <Panel title="Controls">
            <div className="space-y-5">
              <ControlSlider
                label="Flow rate Q"
                value={flow}
                min={0.0001}
                max={0.2}
                step={0.0001}
                onChange={setFlow}
                format={(v) => `${(v * 1000).toFixed(1)} L/s`}
                hint="More flow = more velocity = more pressure drop."
              />
              <ControlSlider
                label="Inlet diameter D₁"
                value={d1}
                min={0.01}
                max={0.3}
                step={0.005}
                onChange={setD1}
                format={(v) => `${(v * 100).toFixed(1)} cm`}
                hint="Wider inlet slows the incoming fluid."
              />
              <ControlSlider
                label="Throat diameter D₂"
                value={d2}
                min={0.005}
                max={0.2}
                step={0.005}
                onChange={setD2}
                format={(v) => `${(v * 100).toFixed(1)} cm`}
                hint="Narrower throat = faster fluid = lower pressure."
              />
              <div className="space-y-2">
                <span className="eyebrow">Fluid</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(FLUIDS).map(([key, f]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFluid(key)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition ${
                        fluid === key
                          ? 'border-border bg-secondary text-foreground'
                          : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="eyebrow">Real scenarios</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => loadPreset(p)}
                      className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </GameShell>
  );
}