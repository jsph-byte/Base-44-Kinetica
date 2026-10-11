import {
  ArrowLeftRight,
  Brain,
  Calculator,
  CircleDot,
  Crosshair,
  Droplets,
  Flame,
  FlaskConical,
  Gauge,
  Grid3x3,
  Hash,
  ListOrdered,
  Palette,
  Repeat,
  Thermometer,
  Timer,
  Variable,
  Waves,
  Zap,
} from 'lucide-react';

export const CATEGORY_META = {
  physics: {
    label: 'Physics simulation',
    noun: 'Physics',
    ink: 'ink-physics',
    soft: 'bg-physics-soft',
    line: 'line-physics',
    fill: 'fill-physics',
  },
  math: {
    label: 'Math challenge',
    noun: 'Math',
    ink: 'ink-math',
    soft: 'bg-math-soft',
    line: 'line-math',
    fill: 'fill-math',
  },
  brain: {
    label: 'Brain game',
    noun: 'Brain',
    ink: 'ink-brain',
    soft: 'bg-brain-soft',
    line: 'line-brain',
    fill: 'fill-brain',
  },
};

export const GAMES = [
  {
    key: 'projectile',
    title: 'Projectile Lab',
    category: 'physics',
    path: '/play/projectile',
    icon: Crosshair,
    blurb:
      'Choose a launch angle and speed, then watch the arc unfold across 120 metres of ground — and drop it on the flag.',
    teaches: 'Range, apex and flight time from speed and angle',
    tags: ['Kinematics', 'Gravity'],
  },
  {
    key: 'pendulum',
    title: 'Pendulum Lab',
    category: 'physics',
    path: '/play/pendulum',
    icon: Timer,
    blurb:
      'Swing a pendulum and measure its real period, then bend length and gravity until the clock reads exactly 2.00 seconds.',
    teaches: 'Why the period depends on length, not on swing size',
    tags: ['Oscillation', 'Measurement'],
  },
  {
    key: 'collision',
    title: 'Collision Lab',
    category: 'physics',
    path: '/play/collision',
    icon: ArrowLeftRight,
    blurb:
      'Send two carts into each other and check whether momentum survives the crash — then build a perfect hand-off.',
    teaches: 'Conservation of momentum, and where energy goes',
    tags: ['Momentum', 'Energy'],
  },
  {
    key: 'orbit',
    title: 'Orbit Lab',
    category: 'physics',
    path: '/play/orbit',
    icon: CircleDot,
    blurb:
      'Launch a satellite and hunt for the speed where it circles forever instead of falling in or escaping entirely.',
    teaches: 'Circular velocity, escape velocity and orbital energy',
    tags: ['Gravitation', 'Orbits'],
  },
  {
    key: 'gas',
    title: 'Gas Lab',
    category: 'physics',
    path: '/play/gas',
    icon: FlaskConical,
    blurb:
      'Pump gas into a cylinder, squeeze the piston and watch the pressure climb — the ideal gas law, live.',
    teaches: 'Pressure, volume and temperature on a real gauge',
    tags: ['Thermodynamics', 'Gases'],
  },
  {
    key: 'buoyancy',
    title: 'Buoyancy Lab',
    category: 'physics',
    path: '/play/buoyancy',
    icon: Droplets,
    blurb:
      'Drop an object into the tank and read how much of it sits underwater — Archimedes, with real materials.',
    teaches: 'Floating, sinking and the weight of displaced fluid',
    tags: ['Fluids', 'Density'],
  },
  {
    key: 'conduction',
    title: 'Heat Conduction Lab',
    category: 'physics',
    path: '/play/conduction',
    icon: Thermometer,
    blurb:
      'Stack copper, steel and insulation into a composite wall and watch heat flux pour through — Fourier\'s law, live.',
    teaches: 'Thermal resistance, conductivity and the temperature gradient through a wall',
    tags: ['Heat Transfer', 'Thermal'],
  },
  {
    key: 'carnot',
    title: 'Carnot Cycle',
    category: 'physics',
    path: '/play/carnot',
    icon: Flame,
    blurb:
      'Run an ideal heat engine between two reservoirs and chase the maximum efficiency the laws of thermodynamics allow.',
    teaches: 'Carnot efficiency, the Second Law and the PV diagram',
    tags: ['Thermodynamics', 'Efficiency'],
  },
  {
    key: 'bernoulli',
    title: 'Bernoulli Flow',
    category: 'physics',
    path: '/play/bernoulli',
    icon: Waves,
    blurb:
      'Squeeze a pipe and the fluid speeds up and pressure drops. Balance flow rate, diameter and density on a live gauge.',
    teaches: 'Continuity, Bernoulli\'s equation and the venturi effect',
    tags: ['Fluids', 'Pressure'],
  },
  {
    key: 'mental-math',
    title: 'Mental Math Sprint',
    category: 'math',
    path: '/play/mental-math',
    icon: Zap,
    blurb:
      'Sixty seconds of escalating arithmetic. Answer fast, keep the streak alive and the points climb faster than you do.',
    teaches: 'Fluency with addition, subtraction, multiplication and division',
    tags: ['Arithmetic', 'Sprint'],
  },
  {
    key: 'sequences',
    title: 'Sequence Detective',
    category: 'math',
    path: '/play/sequences',
    icon: ListOrdered,
    blurb:
      'Every row of numbers is hiding a rule. Work out what it is and name the term that comes next.',
    teaches: 'Patterns, constant differences and growing differences',
    tags: ['Patterns', 'Reasoning'],
  },
  {
    key: 'equations',
    title: 'Equation Balancer',
    category: 'math',
    path: '/play/equations',
    icon: Variable,
    blurb:
      'Solve for x, from a one-step warm-up to x on both sides. Slip up and the full worked solution appears.',
    teaches: 'Rearranging equations by doing the same thing to both sides',
    tags: ['Algebra', 'Equations'],
  },
  {
    key: 'estimate',
    title: 'Estimate It',
    category: 'math',
    path: '/play/estimate',
    icon: Gauge,
    blurb:
      'Is 18% of 250 closer to 35 or 55? Eight seconds a question to train the number sense you use every day.',
    teaches: 'Percentages, square roots and rounding to sanity-check a number',
    tags: ['Estimation', 'Percentages'],
  },
  {
    key: 'memory',
    title: 'Memory',
    category: 'brain',
    path: '/play/memory',
    icon: Brain,
    blurb:
      'Flip the cards two at a time and pair the symbols. Fewer moves and a quicker clock score higher.',
    teaches: 'Short-term memory and concentration',
    tags: ['Memory', 'Cards'],
  },
  {
    key: 'sudoku',
    title: 'Sudoku',
    category: 'brain',
    path: '/play/sudoku',
    icon: Grid3x3,
    blurb:
      'Fill the 9×9 grid so every row, column and box holds 1–9. Three difficulties, freshly generated each time.',
    teaches: 'Logic, deduction and patience',
    tags: ['Logic', 'Deduction'],
  },
  {
    key: 'prime-hunter',
    title: 'Prime Hunter',
    category: 'math',
    path: '/play/prime-hunter',
    icon: Hash,
    blurb:
      'Sixty seconds of split-second calls: is it prime or composite? Train the divisibility reflexes mathematicians lean on.',
    teaches: 'Prime numbers, divisibility and number sense',
    tags: ['Primes', 'Speed'],
  },
  {
    key: 'order-of-ops',
    title: 'Order of Operations',
    category: 'math',
    path: '/play/order-of-ops',
    icon: Calculator,
    blurb:
      'Ten expressions, one rule each: parentheses first, then ×, then + and −. Pick the right answer before the trap catches you.',
    teaches: 'Operator precedence and parentheses',
    tags: ['Arithmetic', 'Precedence'],
  },
  {
    key: 'stroop',
    title: 'Colour Match',
    category: 'brain',
    path: '/play/stroop',
    icon: Palette,
    blurb:
      'The word says RED but the ink is blue. Tap the ink colour, not the word — the classic Stroop test, against the clock.',
    teaches: 'Selective attention and cognitive control',
    tags: ['Attention', 'Speed'],
  },
  {
    key: 'simon',
    title: 'Echo',
    category: 'brain',
    path: '/play/simon',
    icon: Repeat,
    blurb:
      'Watch the pattern light up, then play it back. Every round adds one more step — how long a chain can you hold in memory?',
    teaches: 'Working memory and sequence learning',
    tags: ['Memory', 'Sequence'],
  },
];

export const gameByKey = (key) => GAMES.find((g) => g.key === key);

export const gamesByCategory = (category) => GAMES.filter((g) => g.category === category);