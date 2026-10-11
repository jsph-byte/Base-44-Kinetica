import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import SimCanvas from '@/components/lab/SimCanvas';
import ControlSlider from '@/components/lab/ControlSlider';
import PresetButtons from '@/components/lab/PresetButtons';
import Readout from '@/components/lab/Readout';
import GoalPanel from '@/components/lab/GoalPanel';
import { gameByKey } from '@/lib/games';
import { useReadout } from '@/hooks/useReadout';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useGameSave } from '@/hooks/useGameSave';

const game = gameByKey('gas');
const R = 0.08206; // L·atm/(mol·K)
const VMAX = 20;
const TMAX = 500;
const NMAX = 10;
const TOLERANCE = 0.05;

const SCENARIOS = [
  { label: 'Car tire', volume: 10, temp: 300, moles: 0.73 },
  { label: 'Party balloon', volume: 5, temp: 298, moles: 0.2 },
  { label: 'Weather balloon', volume: 50, temp: 253, moles: 0.5 },
  { label: 'Scuba tank', volume: 11, temp: 300, moles: 8 },
];

const randomTarget = () => Math.round((0.8 + Math.random() * 2.2) * 100) / 100;

const freshSim = (volume, temp, moles) => {
  const count = Math.max(6, Math.min(40, Math.round(moles * 6)));
  const particles = Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
  }));
  return { volume, temp, moles, particles };
};

export default function GasLab() {
  const [volume, setVolume] = useState(10);
  const [temp, setTemp] = useState(300);
  const [moles, setMoles] = useState(0.73);
  const [target, setTarget] = useState(randomTarget);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState(null);

  const colors = useThemeColors();
  const { save, state: saveState, reset: resetSave } = useGameSave();
  const sim = useRef(freshSim(volume, temp, moles));
  const readout = useReadout(sim);

  const pressure = (readout.moles * R * readout.temp) / readout.volume;
  const gaugeMax = Math.max(4, Math.ceil((Math.max(pressure, target) * 1.25) / 2) * 2);

  useEffect(() => {
    const state = sim.current;
    state.volume = volume;
    state.temp = temp;
    state.moles = moles;
    const want = Math.max(6, Math.min(40, Math.round(moles * 6)));
    while (state.particles.length < want) {
      state.particles.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });
    }
    if (state.particles.length > want) state.particles.length = want;
  }, [volume, temp, moles]);

  const checkSolved = (value) => {
    const miss = Math.abs(value - target);
    if (miss > TOLERANCE) return;
    const score = Math.max(0, Math.round(100 - miss * 200));
    setOutcome({ pressure: value, miss, score, solved: true });
    save(game, {
      score,
      summary: `pressure ${value.toFixed(2)} atm at ${readout.volume.toFixed(1)} L, ${readout.temp.toFixed(0)} K`,
      playToken: `gas-${attempt}-${target}`,
    });
  };

  const step = (state, dt) => {
    const speed = Math.sqrt(state.temp / 300);
    const piston = 1 - Math.min(1, state.volume / VMAX);
    for (const p of state.particles) {
      p.x += p.vx * dt * speed * 0.5;
      p.y += p.vy * dt * speed * 0.5;
      if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
      if (p.x > 1) { p.x = 1; p.vx = -Math.abs(p.vx); }
      if (p.y < piston) { p.y = piston; p.vy = Math.abs(p.vy); }
      if (p.y > 1) { p.y = 1; p.vy = -Math.abs(p.vy); }
    }
  };

  const apply = () => {
    setAttempt((n) => n + 1);
    setOutcome(null);
    resetSave();
    checkSolved((moles * R * temp) / volume);
  };

  const newTarget = () => {
    const next = randomTarget();
    setTarget(next);
    setOutcome(null);
    resetSave();
  };

  const loadScenario = (s) => {
    setVolume(s.volume > VMAX ? VMAX : s.volume);
    setTemp(s.temp);
    setMoles(s.moles > NMAX ? NMAX : s.moles);
    setOutcome(null);
    resetSave();
  };

  const draw = (ctx, w, h, state) => {
    const cylX = 36;
    const cylW = Math.min(150, w * 0.34);
    const cylTop = 22;
    const cylBottom = h - 26;
    const cylH = cylBottom - cylTop;
    const pistonY = cylTop + cylH * (1 - Math.min(1, state.volume / VMAX));
    const gasH = cylBottom - pistonY;

    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';

    // cylinder walls
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cylX, cylTop - 8);
    ctx.lineTo(cylX, cylBottom);
    ctx.lineTo(cylX + cylW, cylBottom);
    ctx.lineTo(cylX + cylW, cylTop - 8);
    ctx.stroke();
    ctx.lineWidth = 1;

    // gas tint (cold blue -> hot orange)
    const heat = Math.max(0, Math.min(1, (state.temp - 200) / 300));
    const tint = ctx.createLinearGradient(0, pistonY, 0, cylBottom);
    tint.addColorStop(0, `hsl(${200 - heat * 170} 70% ${50 + heat * 10}% / 0.18)`);
    tint.addColorStop(1, `hsl(${200 - heat * 170} 70% ${40 + heat * 10}% / 0.28)`);
    ctx.fillStyle = tint;
    ctx.fillRect(cylX + 1, pistonY, cylW - 2, gasH);

    // particles
    ctx.fillStyle = colors.physics;
    for (const p of state.particles) {
      const px = cylX + 4 + p.x * (cylW - 8);
      const py = pistonY + 4 + p.y * (gasH - 8);
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // piston
    ctx.fillStyle = colors.faint;
    ctx.fillRect(cylX - 6, pistonY - 5, cylW + 12, 6);
    ctx.strokeStyle = colors.ink;
    ctx.beginPath();
    ctx.moveTo(cylX + cylW / 2, pistonY - 5);
    ctx.lineTo(cylX + cylW / 2, cylTop - 14);
    ctx.stroke();
    ctx.fillStyle = colors.faint;
    ctx.fillRect(cylX + cylW / 2 - 10, cylTop - 18, 20, 6);

    // volume ticks
    ctx.fillStyle = colors.faint;
    for (let v = 0; v <= VMAX; v += 5) {
      const y = cylTop + cylH * (1 - v / VMAX);
      ctx.fillText(`${v}`, cylX - 22, y + 3);
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      ctx.moveTo(cylX, y);
      ctx.lineTo(cylX + 4, y);
      ctx.stroke();
    }

    // pressure gauge
    const gx = w - 70;
    const gy = h / 2;
    const gr = 52;
    const start = Math.PI * 0.8;
    const end = Math.PI * 2.2;
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, start, end);
    ctx.stroke();
    ctx.lineWidth = 1;
    const frac = Math.min(1, pressure / gaugeMax);
    ctx.strokeStyle = colors.physics;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, start, start + (end - start) * frac);
    ctx.stroke();
    ctx.lineWidth = 1;
    const angle = start + (end - start) * frac;
    ctx.strokeStyle = colors.ink;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + Math.cos(angle) * (gr - 8), gy + Math.sin(angle) * (gr - 8));
    ctx.stroke();
    ctx.fillStyle = colors.faint;
    ctx.textAlign = 'center';
    ctx.fillText('atm', gx, gy + 10);
    ctx.fillText(`max ${gaugeMax}`, gx, gy + gr + 16);
  };

  const status = outcome?.solved ? 'solved' : attempt > 0 ? 'active' : 'idle';
  const message = outcome
    ? `Pressure reads ${outcome.pressure.toFixed(2)} atm — ${outcome.miss.toFixed(2)} atm ${
        outcome.pressure < target ? 'under' : 'over'
      } the target.`
    : `The gauge shows live pressure. Tune volume, temperature and amount to hit ${target.toFixed(2)} atm.`;

  return (
    <GameShell game={game}>
      <div className="grid gap-6 landscape:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SimCanvas simRef={sim} step={step} draw={draw} className="h-[42vh] min-h-[240px] max-h-[440px]" />

          <Panel title="Live state" subtitle="Read straight off the gas, frame by frame.">
            <Readout
              items={[
                { label: 'Pressure', value: pressure.toFixed(2), unit: 'atm', tone: 'primary' },
                { label: 'Volume', value: readout.volume.toFixed(1), unit: 'L' },
                { label: 'Temperature', value: readout.temp.toFixed(0), unit: 'K' },
                { label: 'Amount of gas', value: readout.moles.toFixed(2), unit: 'mol' },
                {
                  label: 'Target pressure',
                  value: target.toFixed(2),
                  unit: 'atm',
                  tone: 'math',
                },
                { label: 'Attempts', value: `${attempt}` },
              ]}
            />
          </Panel>

          <Panel title="The physics" subtitle="One law links four quantities.">
            <div className="space-y-3">
              <p className="formula">P · V = n · R · T</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                An ideal gas follows one rule: pressure times volume equals the amount of gas times a
                constant times temperature. Squeeze the volume to half and the pressure doubles (Boyle);
                heat it and the pressure climbs (Gay-Lussac); pump in more gas and it rises again. Real
                tyres, weather balloons and scuba tanks all obey the same equation — plug in their numbers
                with the presets and the gauge reads just what a mechanic would measure.
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <GoalPanel
            goal={`Bring the pressure to ${target.toFixed(2)} atm, within ${TOLERANCE} atm.`}
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
                label="Volume V"
                value={volume}
                min={1}
                max={VMAX}
                step={0.1}
                onChange={setVolume}
                format={(value) => `${value.toFixed(1)} L`}
                hint="Smaller volume squeezes the gas — pressure rises."
              />
              <ControlSlider
                label="Temperature T"
                value={temp}
                min={200}
                max={TMAX}
                step={1}
                onChange={setTemp}
                format={(value) => `${value.toFixed(0)} K`}
                hint="Hotter molecules hit the walls harder."
              />
              <ControlSlider
                label="Amount of gas n"
                value={moles}
                min={0.05}
                max={NMAX}
                step={0.01}
                onChange={setMoles}
                format={(value) => `${value.toFixed(2)} mol`}
                hint="Pump in more gas at fixed volume and the pressure climbs."
              />
              <div className="space-y-2">
                <span className="eyebrow">Real scenarios</span>
                <div className="flex flex-wrap gap-1.5">
                  {SCENARIOS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => loadScenario(s)}
                      className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Equation predicts" subtitle="What PV = nRT says for the settings right now.">
            <Readout
              items={[
                { label: 'Predicted pressure', value: ((moles * R * temp) / volume).toFixed(2), unit: 'atm', tone: 'primary' },
                { label: 'Molecules (approx)', value: `${(moles * 6.022e23).toExponential(2)}` },
              ]}
            />
          </Panel>
        </div>
      </div>
    </GameShell>
  );
}