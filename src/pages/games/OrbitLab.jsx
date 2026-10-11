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

const game = gameByKey('orbit');
const BASE_GM = 60000;
const TIME_SCALE = 2;
const VIEW = 175;
const CIRCULAR_LIMIT = 0.05;

const CENTRAL_MASSES = [
  { label: '1× mass', value: 1 },
  { label: '2× mass', value: 2 },
  { label: '3× mass', value: 3 },
];

export default function OrbitLab() {
  const [distance, setDistance] = useState(60);
  const [factor, setFactor] = useState(0.75);
  const [centralMass, setCentralMass] = useState(1);
  const [satMass, setSatMass] = useState(0.001);
  const gm = BASE_GM * (centralMass + satMass);
  const [outcome, setOutcome] = useState(null);
  const [note, setNote] = useState(null);

  const colors = useThemeColors();
  const { save, state: saveState, reset: resetSave } = useGameSave();

  const buildSim = () => {
    const circular = Math.sqrt(gm / distance);
    return {
      GM: gm,
      timeScale: TIME_SCALE,
      r0: distance,
      px: distance,
      py: 0,
      vx: 0,
      vy: factor * circular,
      trail: [{ x: distance, y: 0 }],
      ra: distance,
      rp: distance,
      t: 0,
      laps: 0,
      running: true,
      solved: false,
      prevY: 0,
      radius: distance,
      speed: factor * circular,
      energy: (factor * factor * circular * circular) / 2 - gm / distance,
    };
  };

  const sim = useRef(buildSim());
  const readout = useReadout(sim);

  const evaluate = (state) => {
    const eccentricity = (state.ra - state.rp) / (state.ra + state.rp);
    const score = Math.max(0, Math.round(100 * (1 - eccentricity / 0.25)));
    const solved = eccentricity <= CIRCULAR_LIMIT;
    setOutcome({ score, solved, eccentricity });
    if (solved && !state.solved) {
      state.solved = true;
      save(game, {
        score,
        summary: `near-circular orbit after ${state.laps} revolutions (e = ${eccentricity.toFixed(3)})`,
        playToken: `orbit-${Date.now()}`,
      });
    }
  };

  const step = (state, dt) => {
    if (!state.running) return;
    const substeps = 6;
    const h = (dt * state.timeScale) / substeps;

    for (let i = 0; i < substeps; i += 1) {
      const r2 = state.px * state.px + state.py * state.py;
      const radius = Math.sqrt(r2);
      const accel = -state.GM / (r2 * radius);
      state.vx += accel * state.px * h;
      state.vy += accel * state.py * h;
      state.px += state.vx * h;
      state.py += state.vy * h;
      state.t += h;

      const nextRadius = Math.hypot(state.px, state.py);
      if (nextRadius > state.ra) state.ra = nextRadius;
      if (nextRadius < state.rp) state.rp = nextRadius;

      if (state.prevY < 0 && state.py >= 0) {
        state.laps += 1;
        evaluate(state);
      }
      state.prevY = state.py;
    }

    state.radius = Math.hypot(state.px, state.py);
    state.speed = Math.hypot(state.vx, state.vy);
    state.energy = 0.5 * state.speed * state.speed - state.GM / state.radius;

    if (state.radius > VIEW * 1.75) {
      state.running = false;
      setNote('It escaped the pull — above escape speed the path never curves back.');
    } else if (state.radius < 6) {
      state.running = false;
      setNote('It fell into the centre: too little sideways speed, so gravity won.');
    }

    const last = state.trail[state.trail.length - 1];
    if (!last || Math.hypot(state.px - last.x, state.py - last.y) > 2.5) {
      state.trail.push({ x: state.px, y: state.py });
      if (state.trail.length > 900) state.trail.shift();
    }
  };

  const launch = () => {
    sim.current = buildSim();
    setOutcome(null);
    setNote(null);
    resetSave();
  };

  const draw = (ctx, w, h, state) => {
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) / 2 / VIEW;
    const X = (x) => cx + x * scale;
    const Y = (y) => cy - y * scale;

    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.grid;
    [40, 80, 120, 160].forEach((ring) => {
      ctx.beginPath();
      ctx.arc(cx, cy, ring * scale, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = colors.mathsSoft;
    ctx.beginPath();
    ctx.arc(cx, cy, state.r0 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (state.trail.length > 1) {
      ctx.strokeStyle = colors.mathsSoft;
      ctx.lineWidth = 1.6;
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

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34);
    glow.addColorStop(0, colors.physics);
    glow.addColorStop(0.35, colors.physicsSoft);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.physics;
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();

    const satX = X(state.px);
    const satY = Y(state.py);
    ctx.fillStyle = colors.maths;
    ctx.shadowColor = colors.maths;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(satX, satY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = colors.muted;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(satX, satY);
    ctx.stroke();

    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.faint;
    ctx.fillText('central mass', cx + 14, cy + 5);
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.maths;
    ctx.fillText(`${state.radius.toFixed(0)} u`, (cx + satX) / 2, (cy + satY) / 2 - 6);
  };

  const circularSpeed = Math.sqrt(gm / distance);
  const escapeSpeed = circularSpeed * Math.SQRT2;
  const eccentricity = readout.ra > readout.rp ? (readout.ra - readout.rp) / (readout.ra + readout.rp) : 0;
  const bound = readout.energy < 0;
  const semiMajor = (readout.ra + readout.rp) / 2;
  const period = semiMajor > 0 ? 2 * Math.PI * Math.sqrt((semiMajor ** 3) / gm) : null;

  const status = outcome?.solved ? 'solved' : readout.running ? 'active' : 'idle';
  let message =
    note ||
    'Launch, watch one full circuit, then nudge the speed factor toward 100% and watch the path round off.';
  if (!note && outcome) {
    message = `Eccentricity after ${readout.laps} revolution${readout.laps === 1 ? '' : 's'}: ${outcome.eccentricity.toFixed(3)}.`;
  }

  return (
    <GameShell game={game}>
      <div className="grid gap-6 landscape:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SimCanvas simRef={sim} step={step} draw={draw} className="h-[42vh] min-h-[240px] max-h-[440px]" />

          <Panel title="Orbital state" subtitle="Read at the satellite's current position.">
            <Readout
              items={[
                { label: 'Distance', value: readout.radius.toFixed(0), unit: 'u' },
                { label: 'Speed', value: readout.speed.toFixed(1), unit: 'u/s', tone: 'math' },
                { label: 'Circular speed here', value: circularSpeed.toFixed(1), unit: 'u/s' },
                { label: 'Escape speed here', value: escapeSpeed.toFixed(1), unit: 'u/s' },
                {
                  label: 'Furthest / closest',
                  value: `${readout.ra.toFixed(0)} / ${readout.rp.toFixed(0)}`,
                  unit: 'u',
                },
                {
                  label: 'Eccentricity',
                  value: eccentricity.toFixed(3),
                  tone: eccentricity <= CIRCULAR_LIMIT ? 'math' : undefined,
                },
                {
                  label: 'Energy',
                  value: `${readout.energy >= 0 ? '+' : '−'}${Math.abs(readout.energy / 1000).toFixed(1)}`,
                  unit: 'k',
                  tone: bound ? 'primary' : undefined,
                },
                { label: 'Revolutions', value: `${readout.laps}` },
                { label: 'Semi-major axis', value: semiMajor.toFixed(0), unit: 'u' },
                { label: 'Orbital period', value: period ? period.toFixed(1) : '—', unit: 's', tone: 'math' },
              ]}
            />
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {bound
                ? 'Energy is negative, so the satellite is bound — it must come back around. Circles are the special case where it never gets closer or further away.'
                : 'Energy is positive: nothing can hold this orbit together, so the satellite is on its way out.'}
            </p>
          </Panel>

          <Panel title="The physics" subtitle="One force, one direction, endlessly repeated.">
            <div className="space-y-3">
              <p className="formula">circular: v = √(GM ÷ r)</p>
              <p className="formula">escape: v = √(2GM ÷ r)</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Gravity always pulls straight toward the centre, which is exactly the sideways tug a
                circle needs. Go slower than circular and the path dips closer at one end; go faster and
                it stretches into an ellipse. Escape speed is just √2 times circular speed — about 41%
                faster — and past that the curve opens up and never returns. Once you know the semi-major
                axis, Kepler's third law gives the period: T² ∝ a³ ÷ (M + m). A heavy satellite orbiting a
                small asteroid really does orbit faster — both bodies swing around their shared centre of
                mass.
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <GoalPanel
            goal="Shape a near-circular orbit — eccentricity under 0.05 after a full revolution."
            status={status}
            message={message}
            score={outcome?.score}
          >
            <Button onClick={launch}>
              <Play className="mr-2 h-4 w-4" />
              Launch
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                sim.current.trail = [];
                sim.current.ra = sim.current.radius;
                sim.current.rp = sim.current.radius;
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear trail
            </Button>
          </GoalPanel>

          <Panel title="Launch settings">
            <div className="space-y-5">
              <ControlSlider
                label="Start distance r₀"
                value={distance}
                min={30}
                max={90}
                step={1}
                onChange={setDistance}
                format={(value) => `${value} u`}
              />
              <ControlSlider
                label="Tangential speed"
                value={factor}
                min={0.4}
                max={1.6}
                step={0.01}
                onChange={setFactor}
                format={(value) => `${(value * 100).toFixed(0)}% of circular`}
                hint="100% of circular speed gives a nearly perfect circle; above 141% it escapes."
              />
              <PresetButtons label="Central mass" options={CENTRAL_MASSES} value={centralMass} onChange={setCentralMass} />
              <ControlSlider
                label="Satellite mass"
                value={satMass}
                min={0}
                max={2}
                step={0.001}
                onChange={setSatMass}
                format={(value) => `${(value * 100).toFixed(2)}% of central`}
                hint="Most satellites are tiny vs their planet. Make the satellite heavy and the two bodies orbit each other — the period shrinks."
              />
              <div className="rounded-lg border border-border/70 bg-secondary/40 p-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Launch speed here:{' '}
                  <span className="font-mono ink-math">{(factor * circularSpeed).toFixed(1)} u/s</span>.
                  A heavier centre needs a faster orbit for the same radius — the ratio never changes.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </GameShell>
  );
}