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

const game = gameByKey('buoyancy');
const G = 9.81;
const TOLERANCE = 0.03;

const FLUIDS = [
  { label: 'Fresh water', value: 1000 },
  { label: 'Ocean', value: 1025 },
  { label: 'Dead Sea', value: 1240 },
  { label: 'Mercury', value: 13546 },
];

const MATERIALS = [
  { label: 'Cork', value: 240 },
  { label: 'Ice', value: 917 },
  { label: 'Wood', value: 750 },
  { label: 'Steel', value: 7850 },
];

const randomTarget = () => Math.round((0.2 + Math.random() * 0.6) * 100) / 100;

const freshSim = () => ({ t: 0, bob: 0 });

export default function BuoyancyLab() {
  const [objDensity, setObjDensity] = useState(600);
  const [size, setSize] = useState(0.5);
  const [fluidDensity, setFluidDensity] = useState(1000);
  const [target, setTarget] = useState(randomTarget);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState(null);

  const colors = useThemeColors();
  const { save, state: saveState, reset: resetSave } = useGameSave();
  const sim = useRef(freshSim());
  const readout = useReadout(sim);

  const volume = size ** 3;
  const mass = objDensity * volume;
  const floats = objDensity < fluidDensity;
  const submerged = floats ? objDensity / fluidDensity : 1;
  const buoyantForce = fluidDensity * volume * submerged * G;
  const weight = mass * G;

  useEffect(() => {
    sim.current.t = 0;
  }, [objDensity, size, fluidDensity]);

  const checkSolved = (value) => {
    const miss = Math.abs(value - target);
    if (miss > TOLERANCE) return;
    const score = Math.max(0, Math.round(100 - miss * 200));
    setOutcome({ submerged: value, miss, score, solved: true });
    save(game, {
      score,
      summary: `${(value * 100).toFixed(0)}% submerged, ${floats ? 'floating' : 'sunk'} in ${(fluidDensity / 1000).toFixed(2)} g/cm³`,
      playToken: `buoyancy-${attempt}-${target}`,
    });
  };

  const step = (state, dt) => {
    state.t += dt;
    state.bob = floats ? Math.sin(state.t * 2.2) * 3 : 0;
  };

  const apply = () => {
    setAttempt((n) => n + 1);
    setOutcome(null);
    resetSave();
    checkSolved(objDensity / fluidDensity < 1 ? objDensity / fluidDensity : 1);
  };

  const newTarget = () => {
    setTarget(randomTarget());
    setOutcome(null);
    resetSave();
  };

  const draw = (ctx, w, h, state) => {
    const tankX = 24;
    const tankW = w - 48;
    const tankTop = 26;
    const tankBottom = h - 24;
    const tankH = tankBottom - tankTop;
    const waterTop = tankTop + tankH * 0.18;
    const waterH = tankBottom - waterTop;

    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';

    // tank walls
    ctx.strokeStyle = colors.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tankX, tankTop);
    ctx.lineTo(tankX, tankBottom);
    ctx.lineTo(tankX + tankW, tankBottom);
    ctx.lineTo(tankX + tankW, tankTop);
    ctx.stroke();
    ctx.lineWidth = 1;

    // fluid
    const fluidGrad = ctx.createLinearGradient(0, waterTop, 0, tankBottom);
    fluidGrad.addColorStop(0, colors.mathsSoft);
    fluidGrad.addColorStop(1, 'rgba(0,0,0,0.0)');
    ctx.fillStyle = colors.mathsSoft;
    ctx.fillRect(tankX + 1, waterTop, tankW - 2, waterH);
    ctx.strokeStyle = colors.maths;
    ctx.beginPath();
    ctx.moveTo(tankX, waterTop);
    ctx.lineTo(tankX + tankW, waterTop);
    ctx.stroke();

    // object
    const objPx = Math.max(26, Math.min(tankW * 0.5, (size / 1) * tankW * 0.5));
    const objX = tankX + tankW / 2 - objPx / 2;
    let objY;
    if (floats) {
      const subPx = objPx * submerged;
      objY = waterTop - (objPx - subPx) + state.bob;
    } else {
      objY = tankBottom - objPx;
    }

    ctx.fillStyle = colors.physics;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(objX, objY, objPx, objPx);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(objX, objY, objPx, objPx);
    ctx.lineWidth = 1;

    // force arrows
    const cx = objX + objPx / 2;
    if (floats) {
      const upLen = Math.min(60, (buoyantForce / 1000) * 60);
      ctx.strokeStyle = colors.maths;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, objY);
      ctx.lineTo(cx, objY - upLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, objY - upLen);
      ctx.lineTo(cx - 5, objY - upLen + 8);
      ctx.lineTo(cx + 5, objY - upLen + 8);
      ctx.closePath();
      ctx.fillStyle = colors.maths;
      ctx.fill();
    }
    const downLen = Math.min(60, (weight / 1000) * 60);
    ctx.strokeStyle = colors.physics;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, objY + objPx);
    ctx.lineTo(cx, objY + objPx + downLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, objY + objPx + downLen);
    ctx.lineTo(cx - 5, objY + objPx + downLen - 8);
    ctx.lineTo(cx + 5, objY + objPx + downLen - 8);
    ctx.closePath();
    ctx.fillStyle = colors.physics;
    ctx.fill();
    ctx.lineWidth = 1;

    ctx.fillStyle = colors.faint;
    ctx.fillText(`${objDensity.toFixed(0)} kg/m³`, objX, objY - 6);
  };

  const status = outcome?.solved ? 'solved' : attempt > 0 ? 'active' : 'idle';
  const message = outcome
    ? `${(outcome.submerged * 100).toFixed(0)}% submerged — ${outcome.miss.toFixed(2)} away from the ${(target * 100).toFixed(0)}% target.`
    : `Tune the object or the fluid until exactly ${(target * 100).toFixed(0)}% sits underwater.`;

  return (
    <GameShell game={game}>
      <div className="grid gap-6 landscape:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SimCanvas simRef={sim} step={step} draw={draw} className="h-[42vh] min-h-[240px] max-h-[440px]" />

          <Panel title="Live forces" subtitle="Archimedes: the upward force equals the weight of fluid pushed aside.">
            <Readout
              items={[
                { label: 'Submerged', value: `${(submerged * 100).toFixed(0)}`, unit: '%', tone: 'primary' },
                { label: 'Buoyant force', value: buoyantForce.toFixed(1), unit: 'N', tone: 'math' },
                { label: 'Weight', value: weight.toFixed(1), unit: 'N' },
                { label: 'Object density', value: objDensity.toFixed(0), unit: 'kg/m³' },
                { label: 'Fluid density', value: fluidDensity.toFixed(0), unit: 'kg/m³' },
                { label: 'Floats?', value: floats ? 'Yes' : 'No, it sinks' },
              ]}
            />
          </Panel>

          <Panel title="The physics" subtitle="Why a steel ship floats but a steel nail sinks.">
            <div className="space-y-3">
              <p className="formula">F_b = ρ_fluid · V_sub · g</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                A floating object sinks until the fluid it displaces weighs exactly as much as it does, so
                the submerged fraction is simply ρ_object ÷ ρ_fluid. Cork (240) rides high on water (1000);
                ice (917) sits 91% under; steel (7850) drops like a stone — unless you shape it into a hull
                that traps air, which is how a 50,000-tonne ship stays dry. Mercury is dense enough to float
                a steel anvil. Change either density and watch the waterline answer back.
              </p>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <GoalPanel
            goal={`Make the object float with exactly ${(target * 100).toFixed(0)}% of its volume submerged, within ${TOLERANCE * 100}%.`}
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
                label="Object density"
                value={objDensity}
                min={100}
                max={9000}
                step={10}
                onChange={setObjDensity}
                format={(value) => `${value.toFixed(0)} kg/m³`}
                hint="Below the fluid density it floats; above, it sinks."
              />
              <PresetButtons label="Object material" options={MATERIALS} value={objDensity} onChange={setObjDensity} />
              <ControlSlider
                label="Object size"
                value={size}
                min={0.1}
                max={1}
                step={0.05}
                onChange={setSize}
                format={(value) => `${value.toFixed(2)} m`}
                hint="Size changes the forces, but not whether it floats."
              />
              <ControlSlider
                label="Fluid density"
                value={fluidDensity}
                min={500}
                max={14000}
                step={10}
                onChange={setFluidDensity}
                format={(value) => `${value.toFixed(0)} kg/m³`}
              />
              <PresetButtons label="Fluid" options={FLUIDS} value={fluidDensity} onChange={setFluidDensity} />
            </div>
          </Panel>
        </div>
      </div>
    </GameShell>
  );
}