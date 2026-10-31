import React, { useMemo } from 'react';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
  G,
  Circle,
  Ellipse,
} from 'react-native-svg';

/* ------------------------------------------------------------------ */
/* Deterministic random so the art is identical on every render        */
/* ------------------------------------------------------------------ */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Brick wall                                                          */
/* ------------------------------------------------------------------ */
const BRICK_FILLS = [
  '#3a140c',
  '#431a0f',
  '#4d2012',
  '#35120b',
  '#4a1c10',
  '#2c0e08',
  '#51241a',
  '#3e170d',
];

interface BrickRect {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  hi: number;
}

export function BrickWall(props: { width: number; height: number }): JSX.Element {
  const { width, height } = props;
  const w = Math.max(1, width);
  const h = Math.max(1, height);

  const bricks = useMemo<BrickRect[]>(() => {
    const rng = makeRng(7421);
    const brickH = 38;
    const brickW = 96;
    const gap = 4;
    const rows = Math.ceil(h / brickH) + 1;
    const out: BrickRect[] = [];
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : -brickW / 2;
      const cols = Math.ceil(w / brickW) + 2;
      for (let c = 0; c < cols; c++) {
        const jitter = (rng() - 0.5) * 6;
        out.push({
          x: offset + c * brickW + gap / 2 + jitter * 0.3,
          y: r * brickH + gap / 2,
          w: brickW - gap + jitter,
          h: brickH - gap,
          fill: BRICK_FILLS[Math.floor(rng() * BRICK_FILLS.length)],
          hi: 0.04 + rng() * 0.1,
        });
      }
    }
    return out;
  }, [w, h]);

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <RadialGradient id="bwGlow" cx="50%" cy="100%" rx="75%" ry="85%" fx="50%" fy="100%">
          <Stop offset="0" stopColor="#ff7a1a" stopOpacity="0.5" />
          <Stop offset="0.45" stopColor="#d9400f" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#1a0603" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bwVignette" cx="50%" cy="60%" rx="75%" ry="75%">
          <Stop offset="0.45" stopColor="#000000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.7" />
        </RadialGradient>
        <LinearGradient id="bwTop" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000000" stopOpacity="0.55" />
          <Stop offset="0.5" stopColor="#000000" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill="#120503" />
      {bricks.map((b, i) => (
        <G key={i}>
          <Rect x={b.x} y={b.y} width={b.w} height={b.h} rx={2} fill={b.fill} />
          <Rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={3}
            rx={1.5}
            fill="#ff9a50"
            opacity={b.hi}
          />
        </G>
      ))}
      <Rect x={0} y={0} width={w} height={h} fill="url(#bwGlow)" />
      <Rect x={0} y={0} width={w} height={h} fill="url(#bwTop)" />
      <Rect x={0} y={0} width={w} height={h} fill="url(#bwVignette)" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Charred logs on a bed of embers                                     */
/* ------------------------------------------------------------------ */
interface LogDef {
  cx: number;
  cy: number;
  rot: number;
  len: number;
  th: number;
  seed: number;
}

const LOGS_BACK: LogDef[] = [
  { cx: 108, cy: 138, rot: -24, len: 240, th: 36, seed: 11 },
  { cx: 302, cy: 140, rot: 21, len: 230, th: 34, seed: 23 },
];
const LOGS_FRONT: LogDef[] = [
  { cx: 198, cy: 148, rot: -42, len: 210, th: 40, seed: 37 },
  { cx: 214, cy: 182, rot: 7, len: 270, th: 32, seed: 53 },
];

function crackPath(len: number, th: number, seed: number): string {
  const rng = makeRng(seed);
  const parts: string[] = [];
  const top = -th / 2 + 3;
  const bottom = th / 2 - 3;
  let x = -len / 2 + 10;
  while (x < len / 2 - 10) {
    // cross crack: a jagged line across the log
    const x1 = x + (rng() - 0.5) * 4;
    const x2 = x + (rng() - 0.5) * 7;
    const x3 = x + (rng() - 0.5) * 5;
    const y1 = top + rng() * 6;
    const y2 = (top + bottom) / 2 + (rng() - 0.5) * 6;
    const y3 = bottom - rng() * 6;
    parts.push(
      `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)}`,
    );
    x += 8 + rng() * 9;
  }
  // a few lengthwise cracks joining the cross cracks
  for (let i = 0; i < 3; i++) {
    const y = top + 5 + rng() * (bottom - top - 10);
    const xs = -len / 2 + 14 + rng() * (len * 0.5);
    const xe = xs + 30 + rng() * 60;
    parts.push(`M${xs.toFixed(1)} ${y.toFixed(1)} L${Math.min(xe, len / 2 - 12).toFixed(1)} ${(y + (rng() - 0.5) * 4).toFixed(1)}`);
  }
  return parts.join(' ');
}

function LogShape(props: { log: LogDef; idx: number }): JSX.Element {
  const { log, idx } = props;
  const d = useMemo(() => crackPath(log.len, log.th, log.seed), [log]);
  const glows = useMemo(() => {
    const rng = makeRng(log.seed + 100);
    const arr: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < 7; i++) {
      arr.push({
        x: -log.len / 2 + 16 + rng() * (log.len - 32),
        y: (rng() - 0.5) * (log.th - 12),
        r: 2 + rng() * 4,
        o: 0.35 + rng() * 0.5,
      });
    }
    return arr;
  }, [log]);
  const gid = `logG${idx}`;
  const half = log.th / 2;
  return (
    <G transform={`translate(${log.cx} ${log.cy}) rotate(${log.rot})`}>
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6a3418" />
          <Stop offset="0.3" stopColor="#2c170c" />
          <Stop offset="1" stopColor="#0a0504" />
        </LinearGradient>
      </Defs>
      <Rect
        x={-log.len / 2}
        y={-half}
        width={log.len}
        height={log.th}
        rx={half * 0.45}
        fill={`url(#${gid})`}
      />
      {glows.map((g, i) => (
        <Circle key={i} cx={g.x} cy={g.y} r={g.r} fill="#ff7a1f" opacity={g.o * 0.5} />
      ))}
      <Path d={d} stroke="#ff6a1a" strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.5} />
      <Path d={d} stroke="#080403" strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.95} />
      <Rect
        x={-log.len / 2 + 6}
        y={-half + 1}
        width={log.len - 12}
        height={2.5}
        rx={1.2}
        fill="#ffae6a"
        opacity={0.22}
      />
    </G>
  );
}

export function Logs(props: { width: number; height: number }): JSX.Element {
  const { width, height } = props;
  const w = Math.max(1, width);
  const h = Math.max(1, height);

  const embers = useMemo(() => {
    const rng = makeRng(9091);
    const colors = ['#ffd45a', '#ffa530', '#ff6a1a', '#ffe9a0', '#ff8a24'];
    const arr: { x: number; y: number; r: number; c: string; o: number }[] = [];
    for (let i = 0; i < 46; i++) {
      arr.push({
        x: 60 + rng() * 280,
        y: 184 + rng() * 30,
        r: 1.2 + rng() * 3.4,
        c: colors[Math.floor(rng() * colors.length)],
        o: 0.55 + rng() * 0.45,
      });
    }
    return arr;
  }, []);

  return (
    <Svg width={w} height={h} viewBox="0 0 400 220" preserveAspectRatio="xMidYMax meet">
      <Defs>
        <RadialGradient id="lgBed" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#ffd45a" stopOpacity="0.95" />
          <Stop offset="0.35" stopColor="#ff8a24" stopOpacity="0.8" />
          <Stop offset="0.75" stopColor="#c8300f" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#c8300f" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="lgHot" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#fff2b0" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#ff8a24" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* glowing bed of embers behind and beneath the logs */}
      <Ellipse cx={200} cy={196} rx={190} ry={30} fill="url(#lgBed)" />
      <Ellipse cx={206} cy={198} rx={90} ry={14} fill="url(#lgHot)" />

      {LOGS_BACK.map((l, i) => (
        <LogShape key={`b${i}`} log={l} idx={i} />
      ))}

      {/* embers between the layers of logs */}
      {embers.slice(0, 22).map((e, i) => (
        <Circle key={`ea${i}`} cx={e.x} cy={e.y - 12} r={e.r} fill={e.c} opacity={e.o * 0.8} />
      ))}

      {LOGS_FRONT.map((l, i) => (
        <LogShape key={`f${i}`} log={l} idx={i + 2} />
      ))}

      {/* incandescent points in front */}
      {embers.map((e, i) => (
        <Circle key={`e${i}`} cx={e.x} cy={e.y} r={e.r} fill={e.c} opacity={e.o} />
      ))}
      <Ellipse cx={200} cy={212} rx={150} ry={7} fill="#ff6a1a" opacity={0.35} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Organic flame tongues (viewBox 0 0 100 200, base at the bottom)     */
/* ------------------------------------------------------------------ */
export const FLAME_SHAPES: string[] = [
  'M22 200 C8 165 30 142 33 112 C36 86 26 62 43 34 C46 22 50 10 56 0 C57 30 72 50 69 80 C67 100 84 122 80 152 C78 176 76 190 78 200 Z',
  'M20 200 C14 170 26 150 24 126 C22 104 34 92 38 70 C42 50 36 30 52 8 C52 26 62 38 64 58 C66 80 80 92 82 120 C84 148 74 172 80 200 Z',
  'M26 200 C10 172 18 148 30 130 C40 114 34 96 42 76 C48 60 62 52 60 22 C60 14 66 6 70 0 C72 24 70 44 76 66 C82 90 76 108 82 132 C86 158 72 180 76 200 Z',
  'M18 200 C12 176 28 160 28 136 C28 114 20 96 32 72 C40 56 44 40 40 18 C54 30 56 46 56 64 C56 82 70 88 74 110 C80 134 70 150 82 176 C84 186 80 194 82 200 Z',
  'M24 200 C16 178 22 156 34 140 C46 124 40 104 46 84 C50 68 44 52 58 30 C62 22 60 12 66 2 C74 28 68 52 72 74 C76 98 86 118 78 146 C74 168 80 188 76 200 Z',
  'M28 200 C12 180 24 158 26 138 C28 116 38 100 36 78 C34 56 46 40 48 20 C58 34 66 36 64 56 C62 74 78 80 78 104 C78 126 86 148 74 170 C70 180 74 192 72 200 Z',
  'M22 200 C18 172 30 158 32 132 C34 106 24 86 38 62 C46 46 40 26 54 6 C56 28 74 44 70 74 C68 94 82 108 80 136 C79 160 72 182 78 200 Z',
];

export function FlameShape(props: {
  d: string;
  width: number;
  height: number;
  idx: number;
}): JSX.Element {
  const { d, width, height, idx } = props;
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const outer = `flO${idx}`;
  const mid = `flM${idx}`;
  const core = `flC${idx}`;
  const scaleAround = (sx: number, sy: number) =>
    `translate(50 200) scale(${sx} ${sy}) translate(-50 -200)`;

  return (
    <Svg width={w} height={h} viewBox="0 0 100 200" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={outer} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d92b0a" stopOpacity="0.0" />
          <Stop offset="0.18" stopColor="#d92b0a" stopOpacity="0.5" />
          <Stop offset="0.5" stopColor="#ff5a14" stopOpacity="0.8" />
          <Stop offset="0.85" stopColor="#ff8a1f" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#ffb02e" stopOpacity="0.95" />
        </LinearGradient>
        <LinearGradient id={mid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ff9a1f" stopOpacity="0.0" />
          <Stop offset="0.25" stopColor="#ffa526" stopOpacity="0.75" />
          <Stop offset="0.7" stopColor="#ffc94a" stopOpacity="0.92" />
          <Stop offset="1" stopColor="#ffe27a" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id={core} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fff2b0" stopOpacity="0.0" />
          <Stop offset="0.35" stopColor="#fff2b0" stopOpacity="0.7" />
          <Stop offset="1" stopColor="#fffbe8" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Path d={d} fill={`url(#${outer})`} />
      <G transform={scaleAround(0.72, 0.8)}>
        <Path d={d} fill={`url(#${mid})`} />
      </G>
      <G transform={scaleAround(0.42, 0.52)}>
        <Path d={d} fill={`url(#${core})`} />
      </G>
    </Svg>
  );
}
