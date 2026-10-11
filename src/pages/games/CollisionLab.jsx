import { useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameShell from '@/components/lab/GameShell';
import Panel from '@/components/lab/Panel';
import SimCanvas from '@/components/lab/SimCanvas';
import ControlSlider from '@/components/lab/ControlSlider';
import Readout from '@/components/lab/Readout';
import GoalPanel from '@/components/lab/GoalPanel';
import { gameByKey } from '@/lib/games';
import { useReadout } from '@/hooks/useReadout';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useGameSave } from '@/hooks/useGameSave';

const game = gameByKey('collision');
const CART_WIDTH = 0.8;
const VIEW = 15;
const STOP_AT_REST = 0.05;

export default function CollisionLab() {
  const [massA, setMassA] = useState(2);
  const [massB, setMassB] = useState(2);
  const [speedA, setSpeedA] = useState(3);
  const [speedB, setSpeedB] = useState(-1.5);
  const [restitution, setRestitution] = useState(1);
  const [contactTime, setContactTime] = useState(0.05);
  const [outcome, setOutcome] = useState(null);

  const colors = useThemeColors();
  const { save, state: saveState, reset: resetSave } = useGameSave();

  const buildSim = () => {
    const beforeP = massA * speedA + massB * speedB;
    const beforeKe = 0.5 * massA * speedA ** 2 + 0.5 * massB * speedB ** 2;
    return {
      m1: massA,
      m2: massB,
      e: restitution,
      v1: speedA,
      v2: speedB,
      x1: 2.4,
      x2: 8.8,
      u1: speedA,
      u2: speedB,
      started: false,
      collided: false,
      contactX: null,
      t: 0,
      before: { p: beforeP, ke: beforeKe },
      after: null,
    };
  };

  const sim = useRef(buildSim());
  const readout = useReadout(sim);

  const onCollide = (state) => {
    const miss = Math.abs(state.u1);
    const score = Math.max(0, Math.round((100 * (1 - miss / 2)) / 5) * 5);
    const solved = miss <= STOP_AT_REST && state.u2 > 0;
    setOutcome({ score, solved, v1After: state.u1, v2After: state.u2 });
    if (solved) {
      save(game, {
        score,
        summary: `cart A left at ${state.u1.toFixed(2)} m/s, B at ${state.u2.toFixed(2)} m/s`,
        playToken: `collision-${Date.now()}`,
      });
    }
  };

  const step = (state, dt) => {
    if (!state.started) return;
    state.x1 += state.u1 * dt;
    state.x2 += state.u2 * dt;
    state.t += dt;

    if (!state.collided && state.x2 - state.x1 <= CART_WIDTH && state.u1 > state.u2) {
      const total = state.m1 + state.m2;
      const nextA =
        ((state.m1 - state.e * state.m2) * state.u1 + (1 + state.e) * state.m2 * state.u2) / total;
      const nextB =
        ((state.m2 - state.e * state.m1) * state.u2 + (1 + state.e) * state.m1 * state.u1) / total;
      state.u1 = nextA;
      state.u2 = nextB;
      state.collided = true;
      state.contactX = (state.x1 + state.x2) / 2;
      state.after = {
        p: state.m1 * nextA + state.m2 * nextB,
        ke: 0.5 * state.m1 * nextA * nextA + 0.5 * state.m2 * nextB * nextB,
      };
      onCollide(state);
    }

    if (state.x1 > 24 || state.x1 < -12 || state.x2 > 24 || state.x2 < -12) state.started = false;
  };

  const run = () => {
    const next = buildSim();
    next.started = true;
    sim.current = next;
    setOutcome(null);
    resetSave();
  };

  const reset = () => {
    sim.current = buildSim();
    setOutcome(null);
    resetSave();
  };

  const draw = (ctx, w, h, state) => {
    const padX = 28;
    const scale = (w - padX * 2) / VIEW;
    const toX = (metres) => padX + metres * scale;
    const groundY = h - 54;
    const cartH = 34;

    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1;

    ctx.strokeStyle = colors.grid;
    for (let metres = 0; metres <= VIEW; metres += 1) {
      const x = toX(metres);
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, groundY + (metres % 5 === 0 ? 14 : 8));
      ctx.stroke();
      if (metres % 5 === 0) {
        ctx.fillStyle = colors.faint;
        ctx.fillText(`${metres} m`, x, groundY + 28);
      }
    }

    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padX, groundY);
    ctx.lineTo(w - padX, groundY);
    ctx.stroke();
    ctx.lineWidth = 1;

    const drawCart = (centre, mass, velocity, color, label) => {
      const widthPx = CART_WIDTH * scale;
      const x = toX(centre) - widthPx / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, groundY - cartH, widthPx, cartH, 7);
      ctx.fill();

      if (Math.abs(velocity) > 0.02) {
        const arrow = velocity * 0.42 * scale;
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(centre), groundY - cartH - 24);
        ctx.lineTo(toX(centre) + arrow, groundY - cartH - 24);
        ctx.stroke();
        const tip = toX(centre) + arrow;
        const dir = Math.sign(arrow);
        ctx.beginPath();
        ctx.moveTo(tip, groundY - cartH - 24);
        ctx.lineTo(tip - dir * 6, groundY - cartH - 28);
        ctx.lineTo(tip - dir * 6, groundY - cartH - 20);
        ctx.closePath();
        ctx.fillStyle = colors.ink;
        ctx.fill();
        ctx.lineWidth = 1;
      }

      ctx.fillStyle = colors.ink;
      ctx.fillText(label, toX(centre), groundY - cartH - 38);
    };

    drawCart(state.x1, state.m1, state.u1, colors.physics, `A · ${state.m1.toFixed(1)} kg`);
    drawCart(state.x2, state.m2, state.u2, colors.maths, `B · ${state.m2.toFixed(1)} kg`);

    if (state.contactX != null) {
      ctx.fillStyle = colors.faint;
      ctx.fillText('contact', toX(state.contactX), groundY - cartH - 54);
    }

    const maxKe = Math.max(state.before.ke, state.after?.ke ?? 0, 0.001);
    const barWidth = Math.min(200, w * 0.34);
    const barX = padX;
    const bars = [
      { y: 24, label: 'KE before', value: state.before.ke, color: colors.physics },
      { y: 48, label: 'KE after', value: state.after?.ke ?? 0, color: colors.maths },
    ];
    ctx.textAlign = 'left';
    bars.forEach((bar) => {
      ctx.fillStyle = colors.faint;
      ctx.fillText(bar.label, barX, bar.y + 4);
      ctx.fillStyle = colors.grid;
      ctx.fillRect(barX + 78, bar.y - 4, barWidth, 8);
      ctx.fillStyle = bar.color;
      ctx.fillRect(barX + 78, bar.y - 4, (bar.value / maxKe) * barWidth, 8);
    });
    ctx.textAlign = 'center';
  };

  const after = readout.after;
  const lost = after ? ((readout.before.ke - after.ke) / Math.max(readout.before.ke, 0.001)) * 100 : null;
  const impulse = after ? Math.abs(massA * (speedA - readout.u1)) : null;
  const impactForce = impulse != null ? impulse / contactTime : null;

  const status = outcome?.solved ? 'solved' : readout.collided ? 'active' : 'idle';
  let message =
    'Send A right and B left, watch the crash, then work out which settings hand A\u2019s motion to B.';
  if (outcome) {
    message = `Cart A leaves at ${outcome.v1After.toFixed(2)} m/s, cart B at ${outcome.v2After.toFixed(2)} m/s.`;
  } else if (readout.collided) {
    message = 'A collision happened but momentum was carried away — reset and try different masses.';
  }

  return (
    <GameShell game={game}>
      <div className="grid gap-6 landscape:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SimCanvas simRef={sim} step={step} draw={draw} className="h-[42vh] min-h-[240px] max-h-[440px]" />

          <Panel title="Before and after" subtitle="Momentum should balance exactly. Energy does not have to.">
            <Readout
              items={[
                { label: 'Momentum before', value: readout.before.p.toFixed(2), unit: 'kg·m/s', tone: 'primary' },
                {
                  label: 'Momentum after',
                  value: after ? after.p.toFixed(2) : '—',
                  unit: 'kg·m/s',
                  tone: 'primary',
                },
                { label: 'Energy before', value: readout.before.ke.toFixed(2), unit: 'J' },
                { label: 'Energy after', value: after ? after.ke.toFixed(2) : '—', unit: 'J' },
                {
                  label: 'Energy lost',
                  value: lost != null ? `${lost.toFixed(0)}` : '—',
                  unit: '%',
                  tone: lost != null && lost > 1 ? 'math' : undefined,
                },
                { label: 'Velocities now', value: `${readout.u1.toFixed(2)} / ${readout.u2.toFixed(2)}`, unit: 'm/s' },
                { label: 'Impulse', value: impulse != null ? impulse.toFixed(2) : '—', unit: 'N·s' },
                { label: 'Avg impact force', value: impactForce != null ? impactForce.toFixed(1) : '—', unit: 'N', tone: 'math' },
              ]}
            />
          </Panel>

          <Panel title="The physics" subtitle="An impulse changes both speeds at once.">
            <div className="space-y-3">
              <p className="formula">m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂</p>
              <p className="formula">e = (v₂ − v₁) ÷ (u₁ − u₂)</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Momentum is always conserved — the &quot;after&quot; figure above matches the
                &quot;before&quot; figure no matter what you choose. Kinetic energy is a different story:
                at e = 1 the collision is perfectly elastic and energy is kept; the softer you set e, the
                more energy disappears into heat and noise. Two equal masses with e = 1 swap speeds
                entirely, which is how a moving ball can stop dead by handing everything to a still one. The
                impulse — the momentum each cart gains or loses — is fixed by the masses and speeds; divide
                it by the contact time and you get the average force, the figure that crushes a car bumper
                or cracks an egg.
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <GoalPanel
            goal="Bring cart A to a standstill — under 0.05 m/s — while cart B rolls away to the right."
            status={status}
            message={message}
            score={outcome?.score}
          >
            <Button onClick={run}>
              <Play className="mr-2 h-4 w-4" />
              Run
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </GoalPanel>

          <Panel title="Setup">
            <div className="space-y-5">
              <ControlSlider
                label="Cart A mass"
                value={massA}
                min={0.5}
                max={5}
                step={0.1}
                onChange={setMassA}
                format={(value) => `${value.toFixed(1)} kg`}
              />
              <ControlSlider
                label="Cart A velocity"
                value={speedA}
                min={0.5}
                max={5}
                step={0.1}
                onChange={setSpeedA}
                format={(value) => `${value.toFixed(1)} m/s →`}
              />
              <ControlSlider
                label="Cart B mass"
                value={massB}
                min={0.5}
                max={5}
                step={0.1}
                onChange={setMassB}
                format={(value) => `${value.toFixed(1)} kg`}
              />
              <ControlSlider
                label="Cart B velocity"
                value={speedB}
                min={-4}
                max={4}
                step={0.1}
                onChange={setSpeedB}
                format={(value) => `${Math.abs(value).toFixed(1)} m/s ${value < 0 ? '←' : '→'}`}
              />
              <ControlSlider
                label="Bounciness e"
                value={restitution}
                min={0}
                max={1}
                step={0.05}
                onChange={setRestitution}
                format={(value) => value.toFixed(2)}
                hint="1 keeps all the kinetic energy, 0 means the carts stick together."
              />
              <ControlSlider
                label="Contact time"
                value={contactTime}
                min={0.005}
                max={0.2}
                step={0.005}
                onChange={setContactTime}
                format={(value) => `${(value * 1000).toFixed(0)} ms`}
                hint="Shorter contact means a sharper hit — the same impulse delivered as a bigger force."
              />
            </div>
          </Panel>
        </div>
      </div>
    </GameShell>
  );
}