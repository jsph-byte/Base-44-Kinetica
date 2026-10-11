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

const game = gameByKey('pendulum');
const TARGET_PERIOD = 2;
const TOLERANCE = 0.03;

const GRAVITIES = [
  { label: 'Moon', value: 1.62 },
  { label: 'Mars', value: 3.72 },
  { label: 'Earth', value: 9.81 },
  { label: 'Jupiter', value: 24.79 },
];

const freshSim = (degrees = 12) => ({
  L: 1,
  g: 9.81,
  damping: 0,
  theta: (degrees * Math.PI) / 180,
  theta0: (degrees * Math.PI) / 180,
  omega: 0,
  t: 0,
  running: false,
  lastCross: null,
  measured: null,
  cycles: 0,
  solved: false,
});

export default function PendulumLab() {
  const [length, setLength] = useState(1);
  const [gravity, setGravity] = useState(9.81);
  const [amplitude, setAmplitude] = useState(12);
  const [damping, setDamping] = useState(0);
  const [mass, setMass] = useState(1);
  const [outcome, setOutcome] = useState(null);

  const colors = useThemeColors();
  const { save, state: saveState, reset: resetSave } = useGameSave();
  const sim = useRef(freshSim(amplitude));
  const readout = useReadout(sim);

  const theoretical = 2 * Math.PI * Math.sqrt(length / gravity);

  useEffect(() => {
    const state = sim.current;
    state.L = length;
    state.g = gravity;
    state.damping = damping;
    if (!state.running) {
      state.theta = (amplitude * Math.PI) / 180;
      state.omega = 0;
    }
  }, [length, gravity, damping, amplitude]);

  const onSolved = (measured) => {
    const score = Math.max(0, Math.round(100 - Math.abs(measured - TARGET_PERIOD) * 300));
    setOutcome({ measured, score });
    save(game, {
      score,
      summary: `period ${measured.toFixed(3)} s from L = ${length.toFixed(2)} m`,
      playToken: `pendulum-${Date.now()}`,
    });
  };

  const step = (state, dt) => {
    if (!state.running) return;
    const substeps = 8;
    const h = dt / substeps;

    for (let i = 0; i < substeps; i += 1) {
      const previous = state.theta;
      const alpha = -(state.g / state.L) * Math.sin(state.theta) - state.damping * state.omega;
      state.omega += alpha * h;
      state.theta += state.omega * h;
      state.t += h;

      if (previous < 0 && state.theta >= 0 && state.omega > 0) {
        if (state.lastCross != null) {
          state.measured = state.t - state.lastCross;
          state.cycles += 1;
          if (!state.solved && Math.abs(state.measured - TARGET_PERIOD) <= TOLERANCE) {
            state.solved = true;
            onSolved(state.measured);
          }
        }
        state.lastCross = state.t;
      }
    }
  };

  const release = () => {
    const state = sim.current;
    state.theta = (amplitude * Math.PI) / 180;
    state.theta0 = state.theta;
    state.omega = 0;
    state.t = 0;
    state.lastCross = null;
    state.measured = null;
    state.cycles = 0;
    state.solved = false;
    state.running = true;
    setOutcome(null);
    resetSave();
  };

  const draw = (ctx, w, h, state) => {
    const pivotX = w / 2;
    const pivotY = 34;
    const pixelsPerMetre = (h - pivotY - 34) / 2.15;
    const reach = state.L * pixelsPerMetre;
    const bobX = pivotX + Math.sin(state.theta) * reach;
    const bobY = pivotY + Math.cos(state.theta) * reach;
    const swing = Math.max(Math.abs(state.theta0), 0.12);

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX - 40, pivotY);
    ctx.lineTo(pivotX + 40, pivotY);
    ctx.stroke();

    ctx.strokeStyle = colors.physicsSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, reach, Math.PI / 2 - swing, Math.PI / 2 + swing);
    ctx.stroke();

    [-swing, swing].forEach((mark) => {
      const mx = pivotX + Math.sin(mark) * reach;
      const my = pivotY + Math.cos(mark) * reach;
      ctx.strokeStyle = colors.faint;
      ctx.beginPath();
      ctx.moveTo(mx - 6, my);
      ctx.lineTo(mx + 6, my);
      ctx.stroke();
    });

    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = colors.faint;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY + reach + 12);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();
    ctx.lineWidth = 1;

    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.physics;
    ctx.shadowColor = colors.physics;
    ctx.shadowBlur = state.running ? 16 : 0;
    ctx.beginPath();
    ctx.arc(bobX, bobY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.faint;
    ctx.fillText(`${length.toFixed(2)} m`, pivotX + 8, pivotY + reach / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.muted;
    ctx.fillText(`${((state.theta * 180) / Math.PI).toFixed(0)}°`, bobX, bobY - 22);
  };

  const measured = readout.measured;
  const difference =
    measured != null && theoretical ? ((measured - theoretical) / theoretical) * 100 : null;

  const ampRad = (amplitude * Math.PI) / 180;
  const omegaMax = Math.sqrt((2 * gravity * (1 - Math.cos(ampRad))) / length);
  const tensionNow = mass * (gravity * Math.cos(readout.theta) + length * readout.omega * readout.omega);
  const tensionMax = mass * gravity * (3 - 2 * Math.cos(ampRad));
  const keMax = 0.5 * mass * (length * omegaMax) ** 2;

  const status = outcome ? 'solved' : readout.running ? 'active' : 'idle';
  const message = outcome
    ? `Measured ${outcome.measured.toFixed(3)} s against a target of ${TARGET_PERIOD.toFixed(3)} s.`
    : 'Press release, let it swing, and watch the measured period settle. Small swings follow the formula most closely.';

  return (
    <GameShell game={game}>
      <div className="grid gap-6 landscape:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SimCanvas simRef={sim} step={step} draw={draw} className="h-[42vh] min-h-[240px] max-h-[440px]" />

          <Panel title="Live swing" subtitle="The period is timed from the moments the bob passes bottom dead centre.">
            <Readout
              items={[
                {
                  label: 'Angle',
                  value: `${((readout.theta * 180) / Math.PI).toFixed(0)}`,
                  unit: '°',
                },
                { label: 'Angular speed', value: readout.omega.toFixed(2), unit: 'rad/s' },
                {
                  label: 'Measured period',
                  value: measured != null ? measured.toFixed(3) : '—',
                  unit: 's',
                  tone: 'primary',
                },
                {
                  label: 'Formula period',
                  value: theoretical.toFixed(3),
                  unit: 's',
                  tone: 'math',
                },
                {
                  label: 'Difference',
                  value: difference != null ? `${difference > 0 ? '+' : ''}${difference.toFixed(2)}` : '—',
                  unit: '%',
                },
                { label: 'Full swings timed', value: `${readout.cycles}` },
                { label: 'Tension now', value: `${tensionNow.toFixed(1)}`, unit: 'N' },
                { label: 'Max tension', value: `${tensionMax.toFixed(1)}`, unit: 'N', tone: 'math' },
                { label: 'Peak energy', value: `${keMax.toFixed(1)}`, unit: 'J' },
              ]}
            />
          </Panel>

          <Panel title="The physics" subtitle="Why length matters and swing size barely does.">
            <div className="space-y-3">
              <p className="formula">T = 2π √(L ÷ g)</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                For small swings, a pendulum&apos;s period depends only on its length and on gravity —
                never on how heavy the bob is, and only weakly on how far you pull it back. Double the
                length and the period grows by √2. The formula assumes tiny swings, so a wide swing takes
                slightly longer than it predicts: watch the difference figure above grow as you raise the
                amplitude. The bob's mass never changes the period, but it sets the load on the rope: peak
                tension at the bottom runs about mg(3 − 2 cos θ₀), the number a swing-bridge or a climbing
                anchor has to survive.
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <GoalPanel
            goal={`Tune the pendulum until the measured period reads ${TARGET_PERIOD.toFixed(3)} s, within ${TOLERANCE} s.`}
            status={status}
            message={message}
            score={outcome?.score}
          >
            <Button onClick={release}>
              <Play className="mr-2 h-4 w-4" />
              Release
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                sim.current = freshSim(amplitude);
                sim.current.L = length;
                sim.current.g = gravity;
                sim.current.damping = damping;
                setOutcome(null);
                resetSave();
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </GoalPanel>

          <Panel title="Pendulum controls">
            <div className="space-y-5">
              <ControlSlider
                label="Length L"
                value={length}
                min={0.2}
                max={2}
                step={0.01}
                onChange={setLength}
                format={(value) => `${value.toFixed(2)} m`}
                hint={`A ${TARGET_PERIOD.toFixed(2)} s period on Earth needs L ≈ ${(9.81 * (TARGET_PERIOD / (2 * Math.PI)) ** 2).toFixed(3)} m.`}
              />
              <ControlSlider
                label="Bob mass"
                value={mass}
                min={0.1}
                max={20}
                step={0.1}
                onChange={setMass}
                format={(value) => `${value.toFixed(1)} kg`}
                hint="Mass never changes the period — but it sets the peak load on the rope."
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
              <ControlSlider
                label="Release angle θ₀"
                value={amplitude}
                min={5}
                max={80}
                onChange={setAmplitude}
                format={(value) => `${value}°`}
                hint="Wide swings take measurably longer than the formula predicts."
              />
              <ControlSlider
                label="Air resistance"
                value={damping}
                min={0}
                max={0.4}
                step={0.01}
                onChange={setDamping}
                format={(value) => value.toFixed(2)}
                hint="Damping shrinks the swing. Notice the measured period barely moves."
              />
            </div>
          </Panel>
        </div>
      </div>
    </GameShell>
  );
}