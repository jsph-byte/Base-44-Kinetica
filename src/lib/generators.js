const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Builds four distinct whole-number answers, always including the right one. */
function optionsFor(answer, offsets, { positive = false } = {}) {
  const set = new Set([Math.round(answer)]);
  offsets.forEach((offset) => {
    if (set.size >= 4) return;
    const value = Math.round(answer + offset);
    if ((!positive || value > 0) && !set.has(value)) set.add(value);
  });
  let guard = 0;
  while (set.size < 4 && guard < 60) {
    guard += 1;
    const spread = Math.max(3, Math.round(Math.abs(answer) * 0.3) + 2);
    const value = Math.round(answer) + rnd(1, spread) * (Math.random() < 0.5 ? -1 : 1);
    if (!positive || value >= 0) set.add(value);
  }
  return shuffle([...set]).map(String);
}

const signed = (n) => `${n < 0 ? '−' : '+'} ${Math.abs(n)}`;
const coef = (n) => (n === 1 ? '' : n === -1 ? '−' : String(n));

export function arithmeticQuestion(level = 1) {
  const ops = level <= 1 ? ['+', '-'] : level <= 3 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = pick(ops);
  let a;
  let b;
  let answer;
  let explanation;
  let prompt;

  if (op === '+') {
    const cap = level <= 2 ? 40 : level <= 4 ? 120 : 480;
    a = rnd(Math.floor(cap / 4), cap);
    b = rnd(Math.floor(cap / 4), cap);
    answer = a + b;
    const up = Math.ceil(b / 10) * 10;
    explanation = `Round up and give it back: ${a} + ${b} = ${a} + ${up} − ${up - b}`;
    prompt = `${a} + ${b}`;
  } else if (op === '-') {
    const cap = level <= 2 ? 60 : level <= 4 ? 160 : 480;
    a = rnd(Math.floor(cap / 2), cap);
    b = rnd(Math.floor(cap / 6) + 1, a - 3);
    answer = a - b;
    const down = Math.floor(b / 10) * 10;
    explanation =
      down > 0 ? `Take the tens first: ${a} − ${down} − ${b - down}` : `Count back ${b} from ${a}`;
    prompt = `${a} − ${b}`;
  } else if (op === '×') {
    a = rnd(2, level <= 3 ? 9 : 19);
    b = rnd(2, level <= 4 ? 9 : 12);
    answer = a * b;
    explanation =
      b >= 11 ? `Split it: ${a} × ${b} = ${a} × ${b - (b % 10)} + ${a} × ${b % 10}` : `${b} groups of ${a}`;
    prompt = `${a} × ${b}`;
  } else {
    b = rnd(2, 9);
    answer = rnd(2, level <= 4 ? 9 : 14);
    a = b * answer;
    explanation = `${b} × ${answer} = ${a}, so ${a} ÷ ${b} = ${answer}`;
    prompt = `${a} ÷ ${b}`;
  }

  return {
    prompt,
    answer: String(answer),
    options: optionsFor(answer, [1, -1, 2, -2, 3, -3, 10, -10], { positive: true }),
    explanation,
  };
}

export function sequenceQuestion(level = 1) {
  const kinds =
    level <= 1
      ? ['arith', 'geo']
      : level <= 3
        ? ['arith', 'geo', 'fib', 'square']
        : ['arith', 'geo', 'quad', 'fib', 'alt', 'square'];
  const kind = pick(kinds);
  let terms;
  let rule;

  if (kind === 'arith') {
    const d = level <= 2 ? rnd(2, 6) : rnd(3, 14);
    const start = rnd(1, 12);
    terms = Array.from({ length: 6 }, (_, i) => start + d * i);
    rule = `Each step adds ${d}.`;
  } else if (kind === 'geo') {
    const ratio = pick([2, 3]);
    const start = rnd(1, 4);
    terms = [start];
    for (let i = 1; i < 6; i += 1) terms.push(terms[i - 1] * ratio);
    rule = `Each term is multiplied by ${ratio}.`;
  } else if (kind === 'quad') {
    const start = rnd(1, 9);
    const first = rnd(2, 6);
    const growth = rnd(1, 4);
    terms = [start];
    for (let i = 1; i < 6; i += 1) terms.push(terms[i - 1] + first + growth * (i - 1));
    rule = `The gaps grow by ${growth} each time: ${first}, ${first + growth}, ${first + growth * 2}, …`;
  } else if (kind === 'fib') {
    const first = rnd(1, 4);
    const second = rnd(2, 6);
    terms = [first, second];
    for (let i = 2; i < 6; i += 1) terms.push(terms[i - 1] + terms[i - 2]);
    rule = 'Each term is the sum of the two before it.';
  } else if (kind === 'alt') {
    const start = rnd(24, 46);
    const up = rnd(4, 9);
    const down = rnd(2, 5);
    terms = [start];
    for (let i = 1; i < 6; i += 1) terms.push(terms[i - 1] + (i % 2 ? up : -down));
    rule = `Add ${up}, subtract ${down}, repeat.`;
  } else {
    const start = rnd(2, 5);
    terms = Array.from({ length: 6 }, (_, i) => (start + i) * (start + i));
    rule = `Perfect squares in order: ${start}², ${start + 1}², …`;
  }

  const answer = terms[5];
  const gap = terms[1] - terms[0];

  return {
    prompt: `${terms.slice(0, 5).join(', ')}, ?`,
    answer: String(answer),
    options: optionsFor(answer, [gap, -gap, 1, -1, 2, -2, 3, -3, 10, -10], { positive: true }),
    explanation: rule,
  };
}

export function equationQuestion(level = 1) {
  const formats =
    level <= 1
      ? ['simple', 'fraction']
      : level <= 3
        ? ['simple', 'fraction', 'expand']
        : ['simple', 'both', 'expand', 'fraction'];
  const format = pick(formats);
  const a = rnd(2, 9);
  let x;
  let prompt;
  let steps;

  if (format === 'simple') {
    x = rnd(-9, 9) || 1;
    const b = rnd(1, 12) * pick([1, -1]);
    const c = a * x + b;
    prompt = `${a}x ${signed(b)} = ${c}`;
    steps = [
      `${b < 0 ? `Add ${-b}` : `Subtract ${b}`} on both sides: ${a}x = ${c - b}`,
      `Divide both sides by ${a}: x = ${x}`,
    ];
  } else if (format === 'both') {
    x = rnd(-9, 9) || 1;
    const c = rnd(1, a - 1);
    const b = rnd(1, 12) * pick([1, -1]);
    const d = (a - c) * x + b;
    prompt = `${coef(a)}x ${signed(b)} = ${coef(c)}x ${signed(d)}`;
    steps = [
      `Subtract ${coef(c)}x from both sides: ${coef(a - c)}x ${signed(b)} = ${d}`,
      `${b < 0 ? `Add ${-b}` : `Subtract ${b}`} on both sides: ${coef(a - c)}x = ${d - b}`,
      `Divide both sides by ${a - c}: x = ${x}`,
    ];
  } else if (format === 'expand') {
    x = rnd(-9, 9) || 1;
    const b = rnd(1, 9) * pick([1, -1]);
    const c = a * (x + b);
    prompt = `${a}(x ${signed(b)}) = ${c}`;
    steps = [
      `Divide both sides by ${a}: x ${signed(b)} = ${c / a}`,
      `${b < 0 ? `Add ${-b}` : `Subtract ${b}`} on both sides: x = ${x}`,
    ];
  } else {
    const k = rnd(-8, 8) || 2;
    x = a * k;
    const b = rnd(1, 9) * pick([1, -1]);
    const c = k + b;
    prompt = `x/${a} ${signed(b)} = ${c}`;
    steps = [
      `${b < 0 ? `Add ${-b}` : `Subtract ${b}`} on both sides: x/${a} = ${c - b}`,
      `Multiply both sides by ${a}: x = ${x}`,
    ];
  }

  return {
    prompt,
    answer: String(x),
    options: optionsFor(x, [1, -1, 2, -2, 3, -3, 5, -5]),
    explanation: steps.join('\n'),
    steps,
  };
}

export function estimateQuestion(level = 1) {
  const kinds = level <= 1 ? ['percent', 'root'] : ['percent', 'root', 'product'];
  const kind = pick(kinds);

  if (kind === 'percent') {
    const percent = pick([10, 15, 20, 25]);
    const base = rnd(2, 9) * 20;
    const answer = (percent * base) / 100;
    const asTip = percent <= 20 && Math.random() < 0.5;
    const notes = {
      10: `${base / 10} is a tenth of ${base}.`,
      15: `10% is ${base / 10}, half of that is ${base / 20} — together ${answer}.`,
      20: `A fifth of ${base} is ${answer} (double the 10%: ${base / 10}).`,
      25: `A quarter of ${base} is ${answer}.`,
    };
    return {
      prompt: asTip ? `${percent}% tip on a $${base} bill` : `${percent}% of ${base}`,
      answer: String(answer),
      options: optionsFor(answer, [answer * 0.2, -answer * 0.2, 5, -5, 10, -10, 2, -2], {
        positive: true,
      }),
      explanation: notes[percent],
    };
  }

  if (kind === 'root') {
    let n = rnd(40, 400);
    while (Number.isInteger(Math.sqrt(n))) n = rnd(40, 400);
    const answer = Math.round(Math.sqrt(n));
    const low = answer <= Math.sqrt(n) ? answer : answer - 1;
    const high = low + 1;
    return {
      prompt: `√${n} is closest to`,
      answer: String(answer),
      options: optionsFor(answer, [1, -1, 2, -2, 3, -3], { positive: true }),
      explanation: `${low}² = ${low * low} and ${high}² = ${high * high}, so √${n} sits between them.`,
    };
  }

  const first = rnd(3, 9) + rnd(1, 9) / 10;
  const second = rnd(3, 9) + rnd(1, 9) / 10;
  const roundedFirst = Math.round(first);
  const roundedSecond = Math.round(second);
  const answer = roundedFirst * roundedSecond;

  return {
    prompt: `${first.toFixed(1)} × ${second.toFixed(1)} ≈ ?`,
    answer: String(answer),
    options: optionsFor(answer, [2, -2, 4, -4, 6, -6, 10, -10], { positive: true }),
    explanation: `Round both: ${roundedFirst} × ${roundedSecond} = ${answer}.`,
  };
}

const isPrime = (n) => {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
};

export function primeQuestion(level = 1) {
  const max = level <= 2 ? 50 : level <= 3 ? 200 : 999;
  let n;
  let guard = 0;
  if (Math.random() < 0.5) {
    do {
      guard += 1;
      n = rnd(2, max);
    } while (!isPrime(n) && guard < 100);
  } else {
    do {
      guard += 1;
      n = rnd(4, max);
    } while (isPrime(n) && guard < 100);
  }
  return { number: n, isPrime: isPrime(n) };
}

const evalMath = (expr) => {
  const js = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${js})`)();
};

export function orderOfOpsQuestion(level = 1) {
  const useMult = level >= 2;
  const ops = useMult ? ['+', '-', '×'] : ['+', '-'];
  const count = level <= 2 ? 3 : 4;
  const maxN = useMult ? (level <= 3 ? 9 : 12) : 20;
  const useParens = level >= 4;

  const nums = Array.from({ length: count }, () => rnd(2, maxN));
  let operators = Array.from({ length: count - 1 }, () => pick(ops));

  if (useMult && count === 4) {
    const mults = operators.filter((o) => o === '×').length;
    if (mults > 1) {
      operators = operators.map((o) => (o === '×' ? pick(['+', '-']) : o));
      operators[rnd(0, operators.length - 1)] = '×';
    }
  }

  let expr;
  if (useParens && count === 4) {
    if (Math.random() < 0.5) {
      expr = `${nums[0]} ${operators[0]} (${nums[1]} ${operators[1]} ${nums[2]}) ${operators[2]} ${nums[3]}`;
    } else {
      expr = `(${nums[0]} ${operators[0]} ${nums[1]}) ${operators[1]} ${nums[2]} ${operators[2]} ${nums[3]}`;
    }
  } else {
    expr = nums
      .map((n, i) => (i === 0 ? String(n) : `${operators[i - 1]} ${n}`))
      .join(' ');
  }

  const answer = evalMath(expr);
  return {
    prompt: `${expr} =`,
    answer: String(answer),
    options: optionsFor(answer, [1, -1, 2, -2, 3, -3, 5, -5, 10, -10]),
    explanation: 'Multiply before adding, and parentheses always go first.',
  };
}