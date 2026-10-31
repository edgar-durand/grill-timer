import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, G, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';
import type { FireBackgroundProps, FireState } from '../types';

type Levels = { f: number; e: number; g: number; a: number; b: number };

const TARGETS: Record<FireState, Levels> = {
  off: { f: 0, e: 0, g: 0, a: 0, b: 0 },
  low: { f: 0.28, e: 0.45, g: 0.3, a: 0, b: 1 },
  burning: { f: 1, e: 1, g: 1, a: 0, b: 1 },
  ashes: { f: 0, e: 0, g: 0, a: 1, b: 1 },
};

const FLAME_X = [0.2, 0.32, 0.43, 0.5, 0.58, 0.69, 0.8];
const FLAME_H = [0.5, 0.78, 0.95, 1, 0.88, 0.72, 0.48];
const FLAME_PATHS = [
  'M50 0 C58 30 80 55 84 95 C88 140 76 185 50 200 C24 190 12 150 18 110 C22 85 40 70 44 45 C46 28 48 14 50 0Z',
  'M70 0 C66 34 90 60 86 110 C84 160 70 195 46 200 C22 196 8 160 14 120 C18 92 34 84 44 62 C54 40 66 20 70 0Z',
  'M30 6 C38 40 18 62 22 100 C26 150 40 190 60 200 C84 192 92 150 84 112 C78 82 60 70 52 46 C46 28 34 22 30 6Z',
];
const LAYERS: Array<{ s: number; grad: string }> = [
  { s: 1, grad: 'o' },
  { s: 0.7, grad: 'm' },
  { s: 0.4, grad: 'c' },
];
const EMBER_COUNT = 16;
const SPARK_COUNT = 8;
const HOT_COLORS = ['#FF3B0A', '#FF6A1A', '#FF8A22', '#E02A08'];
const ASH_COLORS = ['#8A8581', '#6E6A66', '#A39E99', '#59554F'];
const GLINT_INDEXES = [3, 8, 12];
const BRICK_COLORS = ['#4a1a10', '#3e150d', '#55200f', '#34110b', '#4a1c12'];

interface Log {
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
}
const LOGS: Log[] = [
  { x: 40, y: 52, w: 200, h: 30, rot: -24 },
  { x: 170, y: 50, w: 200, h: 28, rot: 20 },
  { x: 90, y: 76, w: 230, h: 32, rot: -10 },
  { x: 160, y: 88, w: 180, h: 30, rot: 8 },
  { x: 30, y: 96, w: 180, h: 28, rot: -4 },
];

function hash(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function crackPaths(log: Log, i: number): { dark: string; glow: string } {
  let dark = '';
  let glow = '';
  const n = Math.floor(log.w / 6) - 1;
  for (let k = 0; k < n; k++) {
    const x = log.x + 4 + k * 6 + hash(i * 50 + k, 1) * 3;
    const y0 = log.y + 1 + hash(i * 50 + k, 2) * 2;
    const y1 = log.y + log.h - 1;
    const skew = (hash(i * 50 + k, 3) - 0.5) * 5;
    const seg = `M${x.toFixed(1)} ${y0.toFixed(1)}L${(x + skew).toFixed(1)} ${y1.toFixed(1)}`;
    dark += seg;
    if (k % 3 === 0) glow += seg;
  }
  for (let k = 0; k < 4; k++) {
    const x = log.x + 8 + hash(i * 9 + k, 4) * (log.w - 30);
    const y = log.y + 5 + hash(i * 9 + k, 5) * (log.h - 10);
    const seg = `M${x.toFixed(1)} ${y.toFixed(1)}L${(x + 16).toFixed(1)} ${(y + (hash(i * 9 + k, 6) - 0.5) * 4).toFixed(1)}`;
    dark += seg;
    glow += seg;
  }
  return { dark, glow };
}

function flickerLoop(v: Animated.Value, steps: Array<[number, number]>, delay: number): Animated.CompositeAnimation {
  const seq = steps.map(([toValue, duration]) =>
    Animated.timing(v, { toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
  );
  return Animated.sequence([Animated.delay(delay), Animated.loop(Animated.sequence(seq))]);
}

function makeValues(n: number, initial: number): Animated.Value[] {
  const out: Animated.Value[] = [];
  for (let i = 0; i < n; i++) out.push(new Animated.Value(initial));
  return out;
}

interface FlameProps {
  x: number;
  w: number;
  h: number;
  idx: number;
  f: Animated.Value;
  flareV: Animated.Value;
  vh: Animated.Value;
  vs: Animated.Value;
}

function Flame({ x, w, h, idx, f, flareV, vh, vs }: FlameProps) {
  const style = useMemo(() => {
    const base = f.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
    const flick = vh.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.78, 1, 1.16] });
    const s = Animated.add(Animated.multiply(base, flick), Animated.multiply(flareV, 0.2));
    const translateY = Animated.subtract(h / 2, Animated.multiply(s, h / 2));
    const rotate = vs.interpolate({ inputRange: [0, 1], outputRange: [`${-5 - (idx % 3)}deg`, `${5 + (idx % 2) * 3}deg`] });
    const scaleX = vs.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.1] });
    const opacity = f.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.55, 0.95] });
    return { opacity, transform: [{ translateY }, { rotate }, { scaleY: s }, { scaleX }] };
  }, [f, flareV, vh, vs, h, idx]);

  const path = FLAME_PATHS[idx % FLAME_PATHS.length];
  return (
    <Animated.View pointerEvents="none" style={[styles.flame, { left: x - w / 2, width: w, height: h }, style]}>
      <Svg width={w} height={h} viewBox="0 0 100 200" preserveAspectRatio="none">
        <Defs>
          <SvgGradient id={`fb-o-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#D81E05" stopOpacity="0" />
            <Stop offset="0.25" stopColor="#F03A0A" stopOpacity="0.7" />
            <Stop offset="0.6" stopColor="#FF7A12" stopOpacity="0.88" />
            <Stop offset="1" stopColor="#FF9A20" stopOpacity="0.95" />
          </SvgGradient>
          <SvgGradient id={`fb-m-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FF8A14" stopOpacity="0" />
            <Stop offset="0.3" stopColor="#FFA21F" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#FFC53A" stopOpacity="0.95" />
          </SvgGradient>
          <SvgGradient id={`fb-c-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFE070" stopOpacity="0" />
            <Stop offset="0.4" stopColor="#FFE88A" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#FFFBE0" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        {LAYERS.map((l) => (
          <G key={l.grad} transform={`translate(${50 * (1 - l.s)} ${200 * (1 - l.s)}) scale(${l.s})`}>
            <Path d={path} fill={`url(#fb-${l.grad}-${idx})`} />
          </G>
        ))}
      </Svg>
    </Animated.View>
  );
}

function LogsSvg({ w, h, glow }: { w: number; h: number; glow: boolean }) {
  const cracks = useMemo(() => LOGS.map((l, i) => crackPaths(l, i)), []);
  return (
    <Svg width={w} height={h} viewBox="0 0 400 136" preserveAspectRatio="xMidYMax meet">
      <Defs>
        <SvgGradient id="fb-log" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4a2312" />
          <Stop offset="0.4" stopColor="#1c0e07" />
          <Stop offset="1" stopColor="#060201" />
        </SvgGradient>
      </Defs>
      {LOGS.map((l, i) => (
        <G key={i} transform={`rotate(${l.rot} ${l.x + l.w / 2} ${l.y + l.h / 2})`}>
          {!glow && (
            <Rect x={l.x} y={l.y} width={l.w} height={l.h} rx={11} fill="url(#fb-log)" stroke="#6a2c10" strokeWidth={1} />
          )}
          {!glow && <Path d={cracks[i].dark} stroke="#030101" strokeWidth={1.1} fill="none" />}
          {glow && <Path d={cracks[i].glow} stroke="#FF8A1E" strokeWidth={1.3} fill="none" />}
        </G>
      ))}
    </Svg>
  );
}

function WallSvg({ w, h }: { w: number; h: number }) {
  const bricks = useMemo(() => {
    const out: Array<{ x: number; y: number; bw: number; c: string; o: number }> = [];
    const rowH = 34;
    const bw = 92;
    const rows = Math.ceil(h / rowH);
    for (let r = 0; r < rows; r++) {
      const y = h - (r + 1) * rowH;
      const off = r % 2 ? -bw / 2 : 0;
      for (let x = off; x < w; x += bw) {
        const t = 1 - Math.max(0, y) / h;
        out.push({
          x: x + 2,
          y: y + 2,
          bw: bw - 4,
          c: BRICK_COLORS[Math.floor(hash(r * 31 + x, 21) * BRICK_COLORS.length)],
          o: Math.min(1, 0.1 + Math.pow(t, 1.1) * 0.95),
        });
      }
    }
    return out;
  }, [w, h]);
  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGradient id="fb-mortar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1a0805" stopOpacity="0" />
          <Stop offset="0.6" stopColor="#1a0805" stopOpacity="0.85" />
          <Stop offset="1" stopColor="#120503" stopOpacity="1" />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill="url(#fb-mortar)" />
      {bricks.map((b, i) => (
        <Rect key={i} x={b.x} y={b.y} width={b.bw} height={30} rx={2} fill={b.c} opacity={b.o} />
      ))}
    </Svg>
  );
}

export default function FireBackground({ state, flare }: FireBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const [reduce, setReduce] = useState(false);
  const [loopsOn, setLoopsOn] = useState(state === 'burning' || state === 'low');

  const H = Math.min(Math.max(height * 0.44, 280), 440);
  const logsH = Math.min(width * 0.34, H * 0.5);

  const anim = useRef<{
    f: Animated.Value;
    e: Animated.Value;
    g: Animated.Value;
    a: Animated.Value;
    b: Animated.Value;
    glint: Animated.Value;
    flare: Animated.Value;
    glow: Animated.Value;
    flameH: Animated.Value[];
    flameS: Animated.Value[];
    ember: Animated.Value[];
    spark: Animated.Value[];
  } | null>(null);
  if (!anim.current) {
    const t = TARGETS[state];
    anim.current = {
      f: new Animated.Value(t.f),
      e: new Animated.Value(t.e),
      g: new Animated.Value(t.g),
      a: new Animated.Value(t.a),
      b: new Animated.Value(t.b),
      glint: new Animated.Value(0),
      flare: new Animated.Value(0),
      glow: new Animated.Value(0.8),
      flameH: makeValues(FLAME_X.length, 0.5),
      flameS: makeValues(FLAME_X.length, 0.5),
      ember: makeValues(EMBER_COUNT, 0.7),
      spark: makeValues(SPARK_COUNT, 0),
    };
  }
  const A = anim.current;

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduce(v);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduce(v));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (state === 'burning' || state === 'low') {
      setLoopsOn(true);
      return undefined;
    }
    const id = setTimeout(() => setLoopsOn(false), 3400);
    return () => clearTimeout(id);
  }, [state]);

  const first = useRef(true);
  useEffect(() => {
    const t = TARGETS[state];
    const toAshes = state === 'ashes';
    const toBurning = state === 'burning';
    const d = (slow: number, fast: number, normal: number) => {
      const v = toAshes ? slow : toBurning ? fast : normal;
      return reduce ? 250 : v;
    };
    const go = (v: Animated.Value, toValue: number, duration: number) =>
      Animated.timing(v, {
        toValue,
        duration: first.current ? 0 : duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    const group = Animated.parallel([
      go(A.f, t.f, d(2200, 1400, 700)),
      go(A.e, t.e, d(2800, 1200, 700)),
      go(A.g, t.g, d(2600, 1400, 700)),
      go(A.a, t.a, d(3000, 1200, 700)),
      go(A.b, t.b, 600),
    ]);
    group.start();

    let glintAnim: Animated.CompositeAnimation;
    if (toAshes && !reduce && !first.current) {
      const step = (to: number, duration: number) =>
        Animated.timing(A.glint, { toValue: to, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
      glintAnim = Animated.sequence([Animated.delay(1500), step(0.6, 600), step(0.2, 900), step(0.5, 700), step(0, 2200)]);
    } else {
      glintAnim = Animated.timing(A.glint, { toValue: 0, duration: 400, useNativeDriver: true });
    }
    glintAnim.start();
    first.current = false;
    return () => {
      group.stop();
      glintAnim.stop();
    };
  }, [state, reduce, A]);

  useEffect(() => {
    if (!flare) return undefined;
    const a = Animated.sequence([
      Animated.timing(A.flare, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(A.flare, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
  }, [flare, A]);

  useEffect(() => {
    if (reduce) {
      A.flameH.forEach((v) => v.setValue(0.5));
      A.flameS.forEach((v) => v.setValue(0.5));
      A.ember.forEach((v) => v.setValue(0.8));
      A.glow.setValue(0.85);
      A.spark.forEach((v) => v.setValue(0));
      return undefined;
    }
    if (!loopsOn) return undefined;
    const running: Animated.CompositeAnimation[] = [];
    A.flameH.forEach((v, i) => {
      running.push(
        flickerLoop(
          v,
          [
            [1, 380 + hash(i, 31) * 300],
            [0.15, 280 + hash(i, 32) * 360],
            [0.75, 240 + hash(i, 33) * 260],
            [0.3, 320 + hash(i, 34) * 400],
            [0.9, 260 + hash(i, 35) * 300],
            [0, 360 + hash(i, 36) * 400],
          ],
          i * 110,
        ),
      );
    });
    A.flameS.forEach((v, i) => {
      running.push(
        flickerLoop(
          v,
          [
            [1, 700 + hash(i, 37) * 700],
            [0.1, 800 + hash(i, 38) * 700],
            [0.7, 600 + hash(i, 39) * 500],
            [0, 700 + hash(i, 40) * 600],
          ],
          i * 170,
        ),
      );
    });
    A.ember.forEach((v, i) => {
      const a = 0.5 + hash(i, 3) * 0.5;
      running.push(
        flickerLoop(
          v,
          [
            [1, 500 + hash(i, 1) * 900],
            [a * 0.4, 400 + hash(i, 2) * 700],
            [a, 600 + hash(i, 4) * 800],
            [0, 700 + hash(i, 5) * 900],
          ],
          hash(i, 6) * 900,
        ),
      );
    });
    running.push(
      flickerLoop(
        A.glow,
        [
          [1, 520],
          [0.55, 700],
          [0.95, 380],
          [0.5, 640],
          [0.85, 460],
        ],
        0,
      ),
    );
    A.spark.forEach((v, i) => {
      const dur = 1800 + hash(i, 7) * 1800;
      running.push(
        Animated.sequence([
          Animated.delay(hash(i, 8) * 2400),
          Animated.loop(
            Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ),
        ]),
      );
    });
    running.forEach((r) => r.start());
    return () => running.forEach((r) => r.stop());
  }, [reduce, loopsOn, A]);

  const flameW = Math.max(width * 0.3, 96);

  const embers = useMemo(() => {
    const out: Array<{ left: number; bottom: number; w: number; h: number; hot: string; ash: string }> = [];
    const span = width * 0.7;
    const slot = span / EMBER_COUNT;
    for (let i = 0; i < EMBER_COUNT; i++) {
      const w = slot * (1.6 + hash(i, 9) * 1.2);
      const h = 10 + hash(i, 10) * 12;
      out.push({
        left: width * 0.15 + slot * (i + 0.5) - w / 2 + (hash(i, 11) - 0.5) * slot * 0.6,
        bottom: 2 + hash(i, 12) * 16,
        w,
        h,
        hot: HOT_COLORS[Math.floor(hash(i, 13) * HOT_COLORS.length)],
        ash: ASH_COLORS[Math.floor(hash(i, 14) * ASH_COLORS.length)],
      });
    }
    return out;
  }, [width]);

  const sparks = useMemo(() => {
    const out: Array<{ left: number; size: number; travel: number; drift: number }> = [];
    for (let i = 0; i < SPARK_COUNT; i++) {
      out.push({
        left: width * (0.3 + hash(i, 15) * 0.4),
        size: 2 + Math.round(hash(i, 16) * 1.5),
        travel: H * (0.55 + hash(i, 17) * 0.45),
        drift: (hash(i, 18) - 0.5) * 70,
      });
    }
    return out;
  }, [width, H]);

  const glowOpacity = useMemo(
    () => Animated.multiply(A.g, A.glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] })),
    [A],
  );
  const crackOpacity = useMemo(
    () => Animated.multiply(A.e, A.glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] })),
    [A],
  );
  const flareOpacity = useMemo(() => Animated.multiply(A.flare, 0.7), [A]);
  const sparkLevel = useMemo(() => A.f.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] }), [A]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.root, { height: H, opacity: A.b }]}
    >
      <View style={[styles.fill, { height: H }]} pointerEvents="none">
        <WallSvg w={width} h={H} />
      </View>

      <Animated.View style={[styles.fill, { height: H, opacity: glowOpacity }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,80,20,0)', 'rgba(255,100,24,0.3)', 'rgba(255,130,40,0.55)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.fill, { height: H * 0.8, opacity: flareOpacity }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,190,90,0)', 'rgba(255,170,60,0.45)', 'rgba(255,210,120,0.8)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {FLAME_X.map((fx, i) => (
        <Flame
          key={`flame-${i}`}
          idx={i}
          x={width * fx}
          w={flameW}
          h={H * 0.66 * FLAME_H[i]}
          f={A.f}
          flareV={A.flare}
          vh={A.flameH[i]}
          vs={A.flameS[i]}
        />
      ))}

      <View style={[styles.logs, { height: logsH }]} pointerEvents="none">
        <LogsSvg w={width} h={logsH} glow={false} />
      </View>
      <Animated.View style={[styles.logs, { height: logsH, opacity: crackOpacity }]} pointerEvents="none">
        <LogsSvg w={width} h={logsH} glow />
      </Animated.View>

      {embers.map((em, i) => (
        <React.Fragment key={`ember-${i}`}>
          <Animated.View
            style={[
              styles.ember,
              {
                left: em.left,
                bottom: em.bottom,
                width: em.w,
                height: em.h,
                borderRadius: em.h / 2,
                backgroundColor: em.ash,
                opacity: A.a,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ember,
              styles.hot,
              {
                left: em.left,
                bottom: em.bottom,
                width: em.w,
                height: em.h,
                borderRadius: em.h / 2,
                backgroundColor: em.hot,
                shadowColor: em.hot,
                opacity: Animated.multiply(
                  A.e,
                  A.ember[i].interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                ),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ember,
              {
                left: em.left + em.w * 0.32,
                bottom: em.bottom + em.h * 0.25,
                width: em.w * 0.36,
                height: em.h * 0.5,
                borderRadius: em.h / 2,
                backgroundColor: '#FFC94A',
                opacity: Animated.multiply(
                  A.e,
                  A.ember[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.35, 0.95] }),
                ),
              },
            ]}
          />
        </React.Fragment>
      ))}

      {GLINT_INDEXES.map((idx) => {
        const em = embers[idx];
        return (
          <Animated.View
            key={`glint-${idx}`}
            style={[
              styles.ember,
              {
                left: em.left + em.w * 0.3,
                bottom: em.bottom + 2,
                width: em.w * 0.4,
                height: em.h * 0.7,
                borderRadius: em.h / 2,
                backgroundColor: '#FF5A1F',
                opacity: Animated.multiply(
                  A.glint,
                  A.ember[idx].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                ),
              },
            ]}
          />
        );
      })}

      <Animated.View style={[styles.fill, { height: 90, opacity: A.a }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(120,115,110,0)', 'rgba(120,115,110,0.55)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {!reduce &&
        sparks.map((sp, i) => (
          <Animated.View
            key={`spark-${i}`}
            style={[
              styles.spark,
              {
                left: sp.left,
                width: sp.size,
                height: sp.size,
                borderRadius: sp.size / 2,
                opacity: Animated.multiply(
                  sparkLevel,
                  A.spark[i].interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 0.6, 0] }),
                ),
                transform: [
                  { translateY: A.spark[i].interpolate({ inputRange: [0, 1], outputRange: [0, -sp.travel] }) },
                  { translateX: A.spark[i].interpolate({ inputRange: [0, 1], outputRange: [0, sp.drift] }) },
                ],
              },
            ]}
          />
        ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  logs: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  flame: {
    position: 'absolute',
    bottom: 36,
  },
  ember: {
    position: 'absolute',
  },
  hot: {
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  spark: {
    position: 'absolute',
    bottom: 70,
    backgroundColor: '#FFC15A',
  },
});
