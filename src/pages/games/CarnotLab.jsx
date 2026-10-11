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

const game = gameByKey('carnot');
const R = 8.314; // J/(mol·K)
const GAMMA = 1.4; // adiabatic index (diatomic ideal gas)
const n = 1; // mol
const TOLERANCE = 1; // %

const PRESETS = [
  { label: 'Steam plant', tHot: 800, tCold: 300, ratio: 3 },
  { label: 'Gas turbine', tHot: 1400, tCold: 300, ratio: 8 },
  { label: 'Geothermal', tHot: 450, tCold: 300, ratio: 2 },
];

const randomTarget = () => Math.round(20 + Math.random() * 50);

const compute = (tHot, tCold, ratio) => {
  const efficiency = 1 - tCold / tHot;
  const V1 = 1;
  const V2 = V1 * ratio;
  const V3 = V2 * Math.pow(tHot / tCold, 1 / (GAMMA - 1));
  const V4 = V1 * Math.pow(tHot / tCold, 1 / (GAMMA - 1));
  const P1 = (n * R * tHot) / V1;
  const P2 = (n * R * tHot) / V2;
  const P3 = (n * R * tCold) / V3;
  const P4 = (n * R * tCold) / V4;
  const Qh = n * R * tHot * Math.log(V2 / V1);
  const Qc = n * R * tCold * Math.log(V3 / V4);
  const W = Qh - Qc;
  return { efficiency, Qh, Qc, W, V1, V2, V3, V4, P1, P2, P3, P4 };
};

export default function CarnotLab() {
  const [tHot, setTHot] = useState(800);
  const [tCold, setTCold] = useState(300);
  const [ratio, setRatio] = useState(3);
  const [target, setTarget] = useState(randomTarget);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState(null);

  const colors = useThemeColors();
  const { save, reset: resetSave } = useGameSave();
  const sim = useRef({ tHot, tCold, ratio, phase: 0 });

  useEffect(() => {
    sim.current.tHot = tHot;
    sim.current.tCold = tCold;
    sim.current.ratio = ratio;
  }, [tHot, tCold, ratio]);

  const result = compute(tHot, tCold, ratio);

  const checkSolved = (eff) => {
    const miss = Math.abs(eff * 100 - target);
    if (miss > TOLERANCE) return;
    const score = Math.max(0, Math.round(100 - (miss / TOLERANCE) * 30));
    setOutcome({ eff, miss, score, solved: true });
    save(game, {
      score,
      summary: `η = ${(eff * 100).toFixed(1)}% with T_H=${tHot}K, T_C=${tCold}K`,
      playToken: `carnot-${attempt}-${target}`,
    });
  };

  const apply = () => {
    setAttempt((n) => n + 1);
    setOutcome(null);
    resetSave();
    checkSolved(result.efficiency);
  };

  const newTarget = () => {
    setTarget(randomTarget());
    setOutcome(null);
    resetSave();
  };

  const loadPreset = (p) => {
    setTHot(p.tHot);
    setTCold(p.tCold);
    setRatio(p.ratio);
    setOutcome(null);
    resetSave();
  };

  const step = (state, dt) => {
    state.phase = (state.phase + dt * 0.3) % 1;
  };

  const draw = (ctx, w, h, state) => {
    const res = compute(state.tHot, state.tCold, state.ratio);
    const padL = 44;
    const padR = 20;
    const padT = 20;
    const padB = 36;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const Vmin = res.V1 * 0.8;
    const Vmax = res.V3 * 1.1;
    const Pmin = res.P3 * 0.7;
    const Pmax = res.P1 * 1.15;
    const xOf = (V) => padL + ((V - Vmin) / (Vmax - Vmin)) * plotW;
    const yOf = (P) => padT + (1 - (P - Pmin) / (Pmax - Pmin)) * plotH;
    const C2 = res.P2 * Math.pow(res.V2, GAMMA);
    const C4 = res.P4 * Math.pow(res.V4, GAMMA);

    // Shaded cycle area
    ctx.fillStyle = 'hsl(38 92% 55% / 0.1)';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const V = res.V1 + (res.V2 - res.V1) * (i / 40);
      const P = (n * R * state.tHot) / V;
      const x = xOf(V), y = yOf(P);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = 0; i <= 40; i++) {
      const V = res.V2 + (res.V3 - res.V2) * (i / 40);
      const P = C2 / Math.pow(V, GAMMA);
      ctx.lineTo(xOf(V), yOf(P));
    }
    for (let i = 0; i <= 40; i++) {
      const V = res.V3 + (res.V4 - res.V3) * (i / 40);
      const P = (n * R * state.tCold) / V;
      ctx.lineTo(xOf(V), yOf(P));
    }
    for (let i = 0; i <= 40; i++) {
      const V = res.V4 + (res.V1 - res.V4) * (i / 40);
      const P = C4 / Math.pow(V, GAMMA);
      ctx.lineTo(xOf(V), yOf(P));
    }
    ctx.closePath();
    ctx.fill();

    // Axes
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();
    ctx.fillStyle = colors.faint;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('V →', padL + plotW - 10, padT + plotH + 18);
    ctx.save();
    ctx.translate(padL - 28, padT + 14);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('P', 0, 0);
    ctx.restore();

    // Four curves
    ctx.strokeStyle = colors.physics;
    ctx.lineWidth = 2;
    const curves = [
      { V1: res.V1, V2: res.V2, iso: true, T: state.tHot },
      { V1: res.V2, V2: res.V3, adi: true, C: C2 },
      { V1: res.V3, V2: res.V4, iso: true, T: state.tCold },
      { V1: res.V4, V2: res.V1, adi: true, C: C4 },
    ];
    for (const c of curves) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const V = c.V1 + (c.V2 - c.V1) * (i / 40);
        const P = c.iso ? (n * R * c.T) / V : c.C / Math.pow(V, GAMMA);
        const x = xOf(V), y = yOf(P);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Corner labels
    const pts = [
      { V: res.V1, P: res.P1, label: '1' },
      { V: res.V2, P: res.P2, label: '2' },
      { V: res.V3, P: res.P3, label: '3' },
      { V: res.V4, P: res.P4, label: '4' },
    ];
    ctx.fillStyle = colors.ink;
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (const p of pts) {
      const x = xOf(p.V), y = yOf(p.P);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(p.label, x, y - 8);
    }

    // Animated indicator
    const phase = state.phase;
    const segs = [
      { from: 0, to: 0.25, V1: res.V1, V2: res.V2, iso: true, T: state.tHot },
      { from: 0.25, to: 0.5, V1: res.V2, V2: res.V3, adi: true, C: C2 },
      { from: 0.5, to: 0.75, V1: res.V3, V2: res.V4, iso: true, T: state.tCold },
      { from: 0.75, to: 1, V1: res.V4, V2: res.V1, adi: true, C: C4 },
    ];
    for (const s of segs) {
      if (phase >= s.from && phase < s.to) {
        const t = (phase - s.from) / (s.to - s.from);
        const V = s.V1 + (s.V2 - s.V1) * t;
        const P = s.iso ? (n * R * s.T) / V : s.C / Math.pow(V, GAMMA);
        ctx.fillStyle = colors.physics;
        ctx.beginPath();
        ctx.arc(xOf(V), yOf(P), 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  };

  const status = outcome?.solved ? 'solved' : attempt > 0 ? 'active' : 'idle';
  const message = outcome
    ? `Efficiency reads ${(outcome.eff * 100).toFixed(1)}% — ${outcome.miss.toFixed(1)}% ${
        outcome.eff * 100 < target ? 'under' : 'over'
      } the target.`
    : `The cycle runs live. Adjust the reservoir temperatures to hit ${target}% efficiency.`;

  return (
    <GameShell game={game}>
      <div className="grid gap-6 landscape:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SimCanvas simRef={sim} step={step} draw={draw} className="h-[42vh] min-h-[240px] max-h-[440px]" />

          <Panel title="Live state" subtitle="The ideal heat engine, frame by frame.">
            <Readout
              items={[
                { label: 'Efficiency η', value: (result.efficiency * 100).toFixed(1), unit: '%', tone: 'primary' },
                { label: 'Heat in Q_H', value: result.Qh.toFixed(0), unit: 'J' },
                { label: 'Work out W', value: result.W.toFixed(0), unit: 'J' },
                { label: 'Heat out Q_C', value: result.Qc.toFixed(0), unit: 'J' },
                { label: 'Target η', value: target.toFixed(0), unit: '%', tone: 'math' },
                { label: 'Attempts', value: `${attempt}` },
              ]}
            />
          </Panel>

          <Panel title="The physics" subtitle="The most efficient engine the laws allow.">
            <div className="space-y-3">
              <p className="formula">η = 1 − T_C / T_H</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                No engine beats the Carnot cycle. Its efficiency depends only on the temperature of the
                hot and cold reservoirs — not the working fluid, not the pressure, not the compression
                ratio. Raise the hot side or lower the cold side and the ceiling lifts. Real steam
                plants, gas turbines and geothermal stations all chase this same limit, and every one
                falls short because no real process is perfectly reversible.
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <GoalPanel
            goal={`Bring the thermal efficiency to ${target}%, within ${TOLERANCE}%.`}
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
                label="Hot reservoir T_H"
                value={tHot}
                min={400}
                max={1500}
                step={10}
                onChange={setTHot}
                format={(v) => `${v.toFixed(0)} K`}
                hint="Hotter source raises the efficiency ceiling."
              />
              <ControlSlider
                label="Cold reservoir T_C"
                value={tCold}
                min={250}
                max={500}
                step={5}
                onChange={setTCold}
                format={(v) => `${v.toFixed(0)} K`}
                hint="Colder sink lifts efficiency further."
              />
              <ControlSlider
                label="Compression ratio V₂/V₁"
                value={ratio}
                min={1.5}
                max={10}
                step={0.1}
                onChange={setRatio}
                format={(v) => `${v.toFixed(1)}:1`}
                hint="Changes the work output, not the efficiency."
              />
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