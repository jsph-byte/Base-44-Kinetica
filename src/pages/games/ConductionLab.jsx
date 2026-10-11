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

const game = gameByKey('conduction');
const A = 1; // m²
const TOLERANCE = 5; // W/m²

const MATERIALS = {
  copper:     { k: 401,  label: 'Copper' },
  aluminum:   { k: 237,  label: 'Aluminum' },
  steel:      { k: 50,   label: 'Steel' },
  concrete:   { k: 1.4,  label: 'Concrete' },
  glass:      { k: 1.05, label: 'Glass' },
  insulation: { k: 0.04, label: 'Insulation' },
};

const PRESETS = [
  { label: 'Furnace wall', tHot: 800, tCold: 300, materials: ['steel', 'concrete', 'insulation'], thickness: 0.3 },
  { label: 'Refrigerator', tHot: 300, tCold: 260, materials: ['steel', 'insulation', 'steel'], thickness: 0.08 },
  { label: 'Heat sink', tHot: 350, tCold: 290, materials: ['copper', 'aluminum', 'steel'], thickness: 0.05 },
];

const randomTarget = () => Math.round(50 + Math.random() * 500);

const compute = (tHot, tCold, thickness, materials) => {
  const layers = materials.map((key) => {
    const mat = MATERIALS[key];
    const L = thickness / materials.length;
    const R = L / (mat.k * A);
    return { ...mat, key, L, R };
  });
  const Rtotal = layers.reduce((s, l) => s + l.R, 0);
  const dT = tHot - tCold;
  const Q = dT / Rtotal;
  const q = Q / A;
  let t = tHot;
  const temps = [tHot];
  for (const l of layers) {
    t -= Q * l.R;
    temps.push(t);
  }
  return { layers, Rtotal, Q, q, temps, dT };
};

export default function ConductionLab() {
  const [tHot, setTHot] = useState(600);
  const [tCold, setTCold] = useState(300);
  const [thickness, setThickness] = useState(0.15);
  const [materials, setMaterials] = useState(['steel', 'concrete', 'insulation']);
  const [target, setTarget] = useState(randomTarget);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState(null);

  const colors = useThemeColors();
  const { save, reset: resetSave } = useGameSave();
  const sim = useRef({ tHot, tCold, thickness, materials, phase: 0 });

  useEffect(() => {
    sim.current.tHot = tHot;
    sim.current.tCold = tCold;
    sim.current.thickness = thickness;
    sim.current.materials = materials;
  }, [tHot, tCold, thickness, materials]);

  const result = compute(tHot, tCold, thickness, materials);

  const checkSolved = (q) => {
    const miss = Math.abs(q - target);
    if (miss > TOLERANCE) return;
    const score = Math.max(0, Math.round(100 - (miss / TOLERANCE) * 30));
    setOutcome({ q, miss, score, solved: true });
    save(game, {
      score,
      summary: `heat flux ${q.toFixed(0)} W/m² through ${materials.map((m) => MATERIALS[m].label).join('/')}`,
      playToken: `conduction-${attempt}-${target}`,
    });
  };

  const apply = () => {
    setAttempt((n) => n + 1);
    setOutcome(null);
    resetSave();
    checkSolved(result.q);
  };

  const newTarget = () => {
    setTarget(randomTarget());
    setOutcome(null);
    resetSave();
  };

  const loadPreset = (p) => {
    setTHot(p.tHot);
    setTCold(p.tCold);
    setThickness(p.thickness);
    setMaterials(p.materials);
    setOutcome(null);
    resetSave();
  };

  const setMaterial = (index, key) => {
    const next = [...materials];
    next[index] = key;
    setMaterials(next);
    setOutcome(null);
    resetSave();
  };

  const step = (state, dt) => {
    state.phase = (state.phase + dt * 0.5) % 1;
  };

  const draw = (ctx, w, h, state) => {
    const res = compute(state.tHot, state.tCold, state.thickness, state.materials);
    const padX = 44;
    const padY = 34;
    const wallX = padX;
    const wallW = w - padX * 2;
    const wallY = padY;
    const wallH = h - padY * 2 - 24;
    const layerW = wallW / state.materials.length;
    const tMin = Math.min(state.tHot, state.tCold);
    const tMax = Math.max(state.tHot, state.tCold);
    const norm = (t) => Math.max(0, Math.min(1, (t - tMin) / Math.max(1, tMax - tMin)));
    const hue = (n) => 220 - n * 220;

    for (let i = 0; i < state.materials.length; i++) {
      const mat = MATERIALS[state.materials[i]];
      const x = wallX + i * layerW;
      const t1 = res.temps[i];
      const t2 = res.temps[i + 1];
      const grad = ctx.createLinearGradient(x, 0, x + layerW, 0);
      grad.addColorStop(0, `hsl(${hue(norm(t1))} 70% 55% / 0.65)`);
      grad.addColorStop(1, `hsl(${hue(norm(t2))} 70% 55% / 0.65)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x, wallY, layerW, wallH);
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, wallY, layerW, wallH);
      ctx.fillStyle = colors.ink;
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(mat.label, x + layerW / 2, wallY + wallH / 2 - 8);
      ctx.font = '9px ui-monospace, monospace';
      ctx.fillStyle = colors.faint;
      ctx.fillText(`k=${mat.k}`, x + layerW / 2, wallY + wallH / 2 + 8);
    }

    ctx.fillStyle = colors.ink;
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= state.materials.length; i++) {
      const x = wallX + i * layerW;
      ctx.fillText(`${res.temps[i].toFixed(0)}K`, x, wallY - 8);
    }

    const arrowY = wallY + wallH + 16;
    for (let i = 0; i < 6; i++) {
      const ax = wallX + 20 + i * ((wallW - 40) / 5);
      const offset = (state.phase + i * 0.16) % 1;
      const ax2 = ax + offset * 16 - 8;
      ctx.strokeStyle = `hsl(30 90% 55% / ${0.3 + offset * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax2 - 8, arrowY);
      ctx.lineTo(ax2 + 8, arrowY);
      ctx.lineTo(ax2 + 4, arrowY - 4);
      ctx.moveTo(ax2 + 8, arrowY);
      ctx.lineTo(ax2 + 4, arrowY + 4);
      ctx.stroke();
    }
    ctx.fillStyle = colors.faint;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText(`heat flux ${res.q.toFixed(0)} W/m² →`, w / 2, arrowY + 16);
  };

  const status = outcome?.solved ? 'solved' : attempt > 0 ? 'active' : 'idle';
  const message = outcome
    ? `Heat flux reads ${outcome.q.toFixed(0)} W/m² — ${outcome.miss.toFixed(0)} W/m² ${
        outcome.q < target ? 'under' : 'over'
      } the target.`
    : `The wall shows live heat flux. Tune temperatures, thickness and materials to hit ${target} W/m².`;

  return (
    <GameShell game={game}>
      <div className="grid gap-6 landscape:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SimCanvas simRef={sim} step={step} draw={draw} className="h-[42vh] min-h-[240px] max-h-[440px]" />

          <Panel title="Live state" subtitle="Steady-state heat transfer through the composite wall.">
            <Readout
              items={[
                { label: 'Heat flux q', value: result.q.toFixed(0), unit: 'W/m²', tone: 'primary' },
                { label: 'Heat rate Q', value: result.Q.toFixed(0), unit: 'W' },
                { label: 'Total R', value: result.Rtotal.toFixed(4), unit: 'K/W' },
                { label: 'ΔT', value: result.dT.toFixed(0), unit: 'K' },
                { label: 'Target flux', value: target.toFixed(0), unit: 'W/m²', tone: 'math' },
                { label: 'Attempts', value: `${attempt}` },
              ]}
            />
          </Panel>

          <Panel title="The physics" subtitle="Fourier's law of heat conduction.">
            <div className="space-y-3">
              <p className="formula">q = ΔT / Σ(Lᵢ / kᵢ)</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Heat flows through a wall the way current flows through resistors in series. Each layer
                adds a thermal resistance R = L/(k·A). The total resistance sets the heat flux: double the
                thickness and you halve the flux; swap steel for copper and it pours through forty times
                faster. Engineers use this to size furnace walls, insulation and heat sinks — the same
                equation every time.
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <GoalPanel
            goal={`Bring the heat flux to ${target} W/m², within ${TOLERANCE} W/m².`}
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
                label="Hot side T_hot"
                value={tHot}
                min={300}
                max={1000}
                step={5}
                onChange={setTHot}
                format={(v) => `${v.toFixed(0)} K`}
                hint="Hotter outside drives more heat through the wall."
              />
              <ControlSlider
                label="Cold side T_cold"
                value={tCold}
                min={200}
                max={500}
                step={5}
                onChange={setTCold}
                format={(v) => `${v.toFixed(0)} K`}
                hint="The temperature difference ΔT sets the driving force."
              />
              <ControlSlider
                label="Wall thickness L"
                value={thickness}
                min={0.02}
                max={0.5}
                step={0.01}
                onChange={setThickness}
                format={(v) => `${(v * 100).toFixed(1)} cm`}
                hint="Thicker wall = more resistance = less heat flux."
              />
              {materials.map((mat, i) => (
                <div key={i} className="space-y-2">
                  <span className="eyebrow">Layer {i + 1}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(MATERIALS).map(([key, m]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setMaterial(i, key)}
                        className={`rounded-full border px-2.5 py-1 text-xs transition ${
                          mat === key
                            ? 'border-border bg-secondary text-foreground'
                            : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
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