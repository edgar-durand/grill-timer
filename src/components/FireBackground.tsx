import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, G, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import type { FireBackgroundProps, FireState } from '../types';

type Levels = { f: number; e: number; g: number; a: number; b: number };

const TARGETS: Record<FireState, Levels> = {
  off: { f: 0, e: 0, g: 0, a: 0, b: 0 },
  low: { f: 0.28, e: 0.45, g: 0.3, a: 0, b: 1 },
  burning: { f: 1, e: 1, g: 1, a: 0, b: 1 },
  ashes: { f: 0, e: 0, g: 0, a: 1, b: 1 },
};

const FLAME_X = [0.08, 0.22, 0.36, 0.5, 0.64, 0.78, 0.92];
const FLAME_H = [0.6, 0.85, 0.7, 1, 0.78, 0.9, 0.58];
const EMBER_COUNT = 16;
const SPARK_COUNT = 10;
const HOT_COLORS = ['#FF3B0A', '#FF6A1A', '#FFA02E', '#E02A08'];
const ASH_COLORS = ['#8A8581', '#6E6A66', '#A39E99', '#59554F'];
const GLINT_INDEXES = [3, 8, 12];

const FLAME_PATH =
  'M52 0 C54 38 92 74 90 132 C88 178 70 200 50 200 C28 200 10 178 10 130 C10 92 34 80 40 52 C44 34 48 20 52 0Z';

function hash(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
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
    const flick = vh.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.12] });
    const s = Animated.add(Animated.multiply(base, flick), Animated.multiply(flareV, 0.2));
    const translateY = Animated.subtract(h / 2, Animated.multiply(s, h / 2));
    const rotate = vs.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });
    const scaleX = vs.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] });
    const opacity = f.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.55, 0.95] });
    return {
      opacity,
      transform: [{ translateY }, { rotate }, { scaleY: s }, { scaleX }],
    };
  }, [f, flareV, vh, vs, h]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.flame, { left: x - w / 2, width: w, height: h }, style]}
    >
      <Svg width={w} height={h} viewBox="0 0 100 200" preserveAspectRatio="none">
        <Defs>
          <SvgGradient id={`fb-outer-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FF4A1C" stopOpacity="0" />
            <Stop offset="0.35" stopColor="#FF6A1F" stopOpacity="0.7" />
            <Stop offset="0.75" stopColor="#FFA630" stopOpacity="0.95" />
            <Stop offset="1" stopColor="#FFE08A" stopOpacity="1" />
          </SvgGradient>
          <SvgGradient id={`fb-inner-${idx}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFB02E" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#FFD36B" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#FFF3C4" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <Path d={FLAME_PATH} fill={`url(#fb-outer-${idx})`} />
        <G transform="translate(22.5 90) scale(0.55)">
          <Path d={FLAME_PATH} fill={`url(#fb-inner-${idx})`} />
        </G>
      </Svg>
    </Animated.View>
  );
}

export default function FireBackground({ state, flare }: FireBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const scheme = useColorScheme();
  const [reduce, setReduce] = useState(false);
  const [loopsOn, setLoopsOn] = useState(state === 'burning' || state === 'low');

  const H = Math.min(Math.max(height * 0.4, 260), 400);

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

  // Reduce motion
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

  // Keep loops running while visible, and a little after the fade out
  useEffect(() => {
    if (state === 'burning' || state === 'low') {
      setLoopsOn(true);
      return undefined;
    }
    const id = setTimeout(() => setLoopsOn(false), 3400);
    return () => clearTimeout(id);
  }, [state]);

  // State transitions
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
    const anims = [
      go(A.f, t.f, d(2200, 1400, 700)),
      go(A.e, t.e, d(2800, 1200, 700)),
      go(A.g, t.g, d(2600, 1400, 700)),
      go(A.a, t.a, d(3000, 1200, 700)),
      go(A.b, t.b, 600),
    ];
    const group = Animated.parallel(anims);
    group.start();

    let glintAnim: Animated.CompositeAnimation;
    if (toAshes && !reduce && !first.current) {
      const step = (to: number, duration: number) =>
        Animated.timing(A.glint, { toValue: to, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
      glintAnim = Animated.sequence([
        Animated.delay(1500),
        step(0.6, 600),
        step(0.2, 900),
        step(0.5, 700),
        step(0, 2200),
      ]);
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

  // Flare when a timer waits for a flip
  useEffect(() => {
    if (!flare) return undefined;
    const a = Animated.sequence([
      Animated.timing(A.flare, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(A.flare, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
  }, [flare, A]);

  // Continuous flicker loops
  useEffect(() => {
    if (reduce) {
      A.flameH.forEach((v) => v.setValue(0.6));
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
            [1, 420 + i * 97],
            [0.25, 360 + ((i * 151) % 5) * 60],
            [0.8, 300 + i * 40],
            [0, 380 + ((i * 7) % 4) * 90],
          ],
          i * 120,
        ),
      );
    });
    A.flameS.forEach((v, i) => {
      running.push(
        flickerLoop(
          v,
          [
            [1, 900 + i * 210],
            [0, 1100 + i * 170],
          ],
          i * 200,
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
          [1, 1400],
          [0.6, 1800],
          [0.9, 900],
          [0.55, 1300],
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

  const flameW = Math.max(width / 4.2, 80);

  const embers = useMemo(() => {
    const out: Array<{ left: number; bottom: number; w: number; h: number; hot: string; ash: string }> = [];
    for (let i = 0; i < EMBER_COUNT; i++) {
      const slot = width / EMBER_COUNT;
      const w = slot * (1.4 + hash(i, 9) * 1.1);
      const h = 14 + hash(i, 10) * 14;
      out.push({
        left: slot * (i + 0.5) - w / 2 + (hash(i, 11) - 0.5) * slot * 0.6,
        bottom: 2 + hash(i, 12) * 22,
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
        left: width * (0.08 + hash(i, 15) * 0.84),
        size: 2 + Math.round(hash(i, 16) * 2),
        travel: H * (0.6 + hash(i, 17) * 0.5),
        drift: (hash(i, 18) - 0.5) * 70,
      });
    }
    return out;
  }, [width, H]);

  const glowOpacity = useMemo(
    () => Animated.multiply(A.g, A.glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] })),
    [A],
  );
  const flareOpacity = useMemo(() => Animated.multiply(A.flare, 0.7), [A]);
  const sparkLevel = useMemo(
    () => A.f.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] }),
    [A],
  );

  const baseColor = scheme === 'dark' ? 'rgba(24,10,4,0.7)' : 'rgba(24,10,4,0.9)';

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.root, { height: H, opacity: A.b }]}
    >
      <LinearGradient
        colors={['rgba(24,10,4,0)', baseColor]}
        style={[styles.fill, { height: H * 0.45 }]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.fill, { height: H, opacity: glowOpacity }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,80,20,0)', 'rgba(255,106,26,0.28)', 'rgba(255,70,12,0.6)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.fill, { height: H * 0.8, opacity: flareOpacity }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,190,90,0)', 'rgba(255,170,60,0.45)', 'rgba(255,210,120,0.8)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.fill, { height: 70, opacity: A.a }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(120,115,110,0)', 'rgba(120,115,110,0.6)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {FLAME_X.map((fx, i) => (
        <Flame
          key={`flame-${i}`}
          idx={i}
          x={width * fx}
          w={flameW}
          h={H * 0.72 * FLAME_H[i]}
          f={A.f}
          flareV={A.flare}
          vh={A.flameH[i]}
          vs={A.flameS[i]}
        />
      ))}

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
                  A.spark[i].interpolate({
                    inputRange: [0, 0.1, 0.7, 1],
                    outputRange: [0, 1, 0.6, 0],
                  }),
                ),
                transform: [
                  {
                    translateY: A.spark[i].interpolate({ inputRange: [0, 1], outputRange: [0, -sp.travel] }),
                  },
                  {
                    translateX: A.spark[i].interpolate({ inputRange: [0, 1], outputRange: [0, sp.drift] }),
                  },
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
  flame: {
    position: 'absolute',
    bottom: 10,
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
    bottom: 28,
    backgroundColor: '#FFC15A',
  },
});
