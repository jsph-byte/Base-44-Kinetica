import { useRef, useState } from 'react';
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

const game = gameByKey('projectile');
const WORLD = 120;
const TOLERANCE = 1.5;

const GRAVITIES = [
  { label: 'Moon', value: 1.62 },
  { label: 'Mars', value: 3.72 },
  { label: 'Earth', value: 9.81 },
  { label: 'Jupiter', value: 24.79 },
];

const AIR_DENSITIES = [
  { label: 'Vacuum', value: 0 },
  { label: 'Air', value: 1.225 },
];

const PROJECTILES = [
  { label: 'Cannonball', mass: 5, cd: 0.47, area: 0.02 },
  { label: 'Baseball', mass: 0.145, cd: 0.35, area: 0.0043 },
  { label: 'Golf ball', mass: 0.046, cd: 0.25, area: 0.0014 },
];

const randomTarget = () => 25 + Math.round(Math.random() * 80);
const freshSim = (target = randomTarget()) => ({
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  t: 0,
  apex: 0,
  flying: false,
  g: 9.81,
  rho: 1.225,
  cd: 0.47,
  area: 0.02,
  mass: 5,
  drag: 0,
  target,
  trail: [],
  landX: null,
});

export default function ProjectileLab() {
  const [speed, setSpeed] = useState(30);
  const [angle, setAngle] = useState(45);
  const [gravity, setGravity] = useState(9.81);
  const [target, setTarget] = useState(randomTarget);
  const [mass, setMass] = useState(5);
  const [dragCoef, setDragCoef] = useState(0.47);
  const [area, setArea] = useState(0.02);
  const [airDensity, setAirDensity] = useState(1.225);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState(null);

  const colors = useThemeColors();
  const { save, state: saveState, reset: resetSave } = useGameSave();
  const sim = useRef(freshSim(target));
  const readout = useReadout(sim);

  const radians = (angle * Math.PI) / 180;
  const predictedRange = (speed * speed * Math.sin(2 * radians)) / gravity;
  const predictedApex = (speed * speed * Math.sin(radians) ** 2) / (2 * gravity);
  const predictedTime = (2 * speed * Math.sin(radians)) / gravity;

  const onLand = (state) => {
    const miss = Math.abs(state.landX - state.target);
    const score = Math.max(0, Math.round((100 * (1 - miss / 10)) / 5) * 5);
    const solved = miss <= TOLERANCE;
    setOutcome({ miss, score, solved, landX: state.landX });
    if (solved) {
      save(game, {
        score,
        summary: `flag at ${state.target} m, landed ${state.landX.toFixed(1)} m`,
        playToken: `projectile-${attempt}-${state.target}`,
      });
    }
  };

  const step = (state, dt) => {
    if (!state.flying) return;
    const prevX = state.x;
    const prevY = state.y;
    const v = Math.hypot(state.vx, state.vy);
    if (v > 0 && state.rho > 0) {
      const aDrag = (0.5 * state.rho * state.cd * state.area * v * v) / state.mass;
      state.vx -= (aDrag * state.vx) / v * dt;
      state.vy -= (aDrag * state.vy) / v * dt;
      state.drag = aDrag * state.mass;
    } else {
      state.drag = 0;
    }
    state.vy -= state.g * dt;
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    state.t += dt;
    if (state.y > state.apex) state.apex = state.y;

    if (state.y <= 0 && state.vy < 0) {
      const fraction = prevY / (prevY - state.y);
      state.landX = prevX + (state.x - prevX) * fraction;
      state.x = state.landX;
      state.y = 0;
      state.flying = false;
      onLand(state);
    }

    const last = state.trail[state.trail.length - 1];
    if (!last || Math.hypot(state.x - last.x, state.y - last.y) > 0.5) {
      state.trail.push({ x: state.x, y: state.y });
    }
  };

  const launch = () => {
    const state = sim.current;
    state.x = 0;
    state.y = 0;
    state.vx = speed * Math.cos(radians);
    state.vy = speed * Math.sin(radians);
    state.g = gravity;
    state.rho = airDensity;
    state.cd = dragCoef;
    state.area = area;
    state.mass = mass;
    state.target = target;
    state.t = 0;
    state.apex = 0;
    state.landX = null;
    state.drag = 0;
    state.trail = [{ x: 0, y: 0 }];
    state.flying = true;
    setOutcome(null);
    resetSave();
    setAttempt((n) => n + 1);
  };

  const newTarget = () => {
    const next = randomTarget();
    setTarget(next);
    setOutcome(null);
    resetSave();
    sim.current = freshSim(next);
  };

  const draw = (ctx, w, h, state) => {
    const padL = 34;
    const padR = 24;
    const padT = 16;
    const padB = 32;
    const scale = (w - padL - padR) / WORLD;
    const groundY = h - padB;
    const X = (value) => padL + value * scale;
    const Y = (value) => groundY - value * scale;

    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1;

    for (let metres = 0; metres <= WORLD; metres += 20) {
      const x = X(metres);
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, groundY);
      ctx.stroke();
      ctx.fillStyle = colors.faint;
      ctx.fillText(`${metres} m`, x, groundY + 16);
    }

    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, groundY);
    ctx.lineTo(w - padR, groundY);
    ctx.stroke();

    const flagX = X(target);
    ctx.strokeStyle = colors.mathsSoft;
    ctx.beginPath();
    ctx.ellipse(flagX, groundY, 1.6 * scale, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = colors.maths;
    ctx.beginPath();
    ctx.moveTo(flagX, groundY);
    ctx.lineTo(flagX, groundY - 66);
    ctx.stroke();
    ctx.fillStyle = colors.maths;
    ctx.beginPath();
    ctx.moveTo(flagX, groundY - 66);
    ctx.lineTo(flagX + 20, groundY - 58);
    ctx.lineTo(flagX, groundY - 50);
    ctx.closePath();
    ctx.fill();

    if (!state.flying) {
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = colors.physicsSoft;
      ctx.beginPath();
      let started = false;
      for (let t = 0; t < 60; t += 0.02) {
        const px = speed * Math.cos(radians) * t;
        const py = speed * Math.sin(radians) * t - 0.5 * gravity * t * t;
        if (py < 0 || px > WORLD) break;
        if (!started) {
          ctx.moveTo(X(px), Y(py));
          started = true;
        } else {
          ctx.lineTo(X(px), Y(py));
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (state.apex > 1) {
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = colors.faint;
      ctx.beginPath();
      ctx.moveTo(padL, Y(state.apex));
      ctx.lineTo(w - padR, Y(state.apex));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = 'left';
      ctx.fillStyle = colors.faint;
      ctx.fillText(`apex ${state.apex.toFixed(1)} m`, padL + 4, Y(state.apex) - 6);
      ctx.textAlign = 'center';
    }

    if (state.trail.length > 1) {
      ctx.strokeStyle = colors.physics;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      state.trail.forEach((point, index) => {
        const px = X(point.x);
        const py = Y(point.y);
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    const bobX = X(state.x);
    const bobY = Y(state.y);
    ctx.fillStyle = colors.physics;
    ctx.shadowColor = colors.physics;
    ctx.shadowBlur = state.flying ? 18 : 0;
    ctx.beginPath();
    ctx.arc(bobX, bobY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (state.flying) {
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bobX, bobY);
      ctx.lineTo(X(state.x + state.vx * 0.5), Y(state.y + state.vy * 0.5));
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    if (state.landX != null) {
      ctx.fillStyle = colors.physics;
      ctx.beginPath();
      ctx.arc(X(state.landX), groundY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const status = outcome?.solved ? 'solved' : attempt > 0 ? 'active' : 'idle';
  const message = outcome
    ? `Landed at ${outcome.landX.toFixed(1)} m — ${outcome.miss.toFixed(1)} m ${
        outcome.landX < target ? 'short' : 'long'
      } of the flag.`
    : 'Launch a shot, watch where it lands, then tune angle and speed to close the gap.';

  return (
    <GameShell game={game}>
      <div className="grid gap-6 landscape:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SimCanvas simRef={sim} step={step} draw={draw} className="h-[42vh] min-h-[240px] max-h-[440px]" />

          <Panel title="Live flight" subtitle="Read straight off the simulation, frame by frame.">
            <Readout
              items={[
                { label: 'Flight time', value: `${readout.t.toFixed(2)}`, unit: 's' },
                {
                  label: 'Distance',
                  value: `${(readout.landX ?? readout.x).toFixed(1)}`,
                  unit: 'm',
                  tone: 'primary',
                },
                { label: 'Height', value: `${readout.y.toFixed(1)}`, unit: 'm' },
                {
                  label: 'Speed',
                  value: `${Math.hypot(readout.vx || 0, readout.vy || 0).toFixed(1)}`,
                  unit: 'm/s',
                },
                { label: 'Peak height', value: `${readout.apex.toFixed(1)}`, unit: 'm' },
                { label: 'Drag force', value: `${(readout.drag || 0).toFixed(1)}`, unit: 'N' },
                { label: 'Shots taken', value: `${attempt}` },
              ]}
            />
          </Panel>

          <Panel title="The physics" subtitle="Two numbers decide the whole arc.">
            <div className="space-y-3">
              <p className="formula">range = v₀² · sin(2θ) ÷ g</p>
              <p className="formula">peak = v₀² · sin²θ ÷ (2g)</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Once the projectile leaves your hand, only gravity acts on it. Horizontal speed stays
                constant; vertical speed loses g every second, goes through zero at the top of the arc,
                then turns negative on the way down. That is why 45° throws furthest on flat ground, and
                why the Moon — with g six times smaller — lets the same throw travel six times further. Add air
                resistance and mass suddenly matters: drag steals speed every moment the projectile is in
                flight, and a heavy cannonball shrugs it off far better than a light golf ball. That is why
                the vacuum formula over-predicts every real throw.
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <GoalPanel
            goal={`Land the projectile within ${TOLERANCE} m of the flag.`}
            status={status}
            message={message}
            score={outcome?.score}
          >
            <Button onClick={launch}>
              <Play className="mr-2 h-4 w-4" />
              Launch
            </Button>
            <Button variant="outline" onClick={newTarget}>
              <RotateCcw className="mr-2 h-4 w-4" />
              New target
            </Button>
          </GoalPanel>

          <Panel title="Launch controls">
            <div className="space-y-5">
              <ControlSlider
                label="Launch speed v₀"
                value={speed}
                min={10}
                max={45}
                step={0.5}
                onChange={setSpeed}
                format={(value) => `${value.toFixed(1)} m/s`}
              />
              <ControlSlider
                label="Launch angle θ"
                value={angle}
                min={5}
                max={85}
                onChange={setAngle}
                format={(value) => `${value}°`}
                hint="45° maximises the range when launching and landing are at the same height."
              />
              <ControlSlider
                label="Gravity g"
                value={gravity}
                min={1.6}
                max={25}
                step={0.01}
                onChange={setGravity}
                format={(value) => `${value.toFixed(2)} m/s²`}
              />
              <PresetButtons label="Gravity presets" options={GRAVITIES} value={gravity} onChange={setGravity} />
              <div className="space-y-2">
                <span className="eyebrow">Real projectiles</span>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECTILES.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setMass(p.mass);
                        setDragCoef(p.cd);
                        setArea(p.area);
                      }}
                      className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <ControlSlider
                label="Projectile mass"
                value={mass}
                min={0.01}
                max={10}
                step={0.01}
                onChange={setMass}
                format={(value) => `${value.toFixed(2)} kg`}
                hint="Heavier projectiles hold their speed better against drag."
              />
              <ControlSlider
                label="Drag coefficient Cd"
                value={dragCoef}
                min={0}
                max={1.5}
                step={0.01}
                onChange={setDragCoef}
                format={(value) => value.toFixed(2)}
                hint="A streamlined dart is ~0.2, a sphere ~0.47, a flat plate ~1.0."
              />
              <ControlSlider
                label="Frontal area"
                value={area}
                min={0.0001}
                max={0.05}
                step={0.0001}
                onChange={setArea}
                format={(value) => `${(value * 10000).toFixed(1)} cm²`}
              />
              <PresetButtons label="Atmosphere" options={AIR_DENSITIES} value={airDensity} onChange={setAirDensity} />
            </div>
          </Panel>

          <Panel title="Vacuum prediction" subtitle="The formulas assume no air. Real flight falls short.">
            <Readout
              items={[
                { label: 'Range (vacuum)', value: predictedRange.toFixed(1), unit: 'm', tone: 'primary' },
                { label: 'Peak height', value: predictedApex.toFixed(1), unit: 'm' },
                { label: 'Flight time', value: predictedTime.toFixed(2), unit: 's' },
                {
                  label: 'Flag distance',
                  value: `${target}`,
                  unit: 'm',
                  tone: 'math',
                },
              ]}
            />
          </Panel>
        </div>
      </div>
    </GameShell>
  );
}