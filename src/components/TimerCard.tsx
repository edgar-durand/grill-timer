import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, StyleSheet, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { TimerCardProps } from '../types';
import { useTheme, tokens } from '../theme';
import { fmt, halfPoint } from '../timing';
import FoodPhoto from './FoodPhoto';

export default function TimerCard({ timer, onToggle, onRemove }: TimerCardProps) {
  const { c, s } = useTheme();
  const t = tokens;
  const enter = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const flipIn = useRef(new Animated.Value(0)).current;
  const doneAnim = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;
  const reduce = useRef(false);
  const flash = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const flipped = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduce.current = !!v; }).catch(() => {});
    Animated.timing(enter, { toValue: 1, duration: t.motion.slow, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter, t.motion.slow]);

  const pct = timer.total > 0 ? Math.min(1, 1 - timer.remaining / timer.total) : 1;
  useEffect(() => {
    Animated.timing(progress, { toValue: pct, duration: 1000, easing: Easing.linear, useNativeDriver: false }).start();
  }, [pct, progress]);

  const half = halfPoint(timer.total);
  const showFlip = !timer.done && timer.remaining <= half;

  useEffect(() => {
    if (!showFlip) return;
    Animated.spring(flipIn, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    if (!flipped.current) {
      flipped.current = true;
      flash.setValue(0);
      halo.setValue(0);
      if (reduce.current) {
        flash.setValue(0.25);
      } else {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(flash, { toValue: 0.55, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(flash, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.timing(halo, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
      }
    }
    if (reduce.current) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: t.motion.pulse, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: t.motion.pulse, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [showFlip, flipIn, pulse, t.motion.fast, t.motion.pulse]);

  useEffect(() => {
    if (!timer.done) return;
    Animated.spring(doneAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    if (!reduce.current) {
      ring.setValue(0);
      Animated.timing(ring, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [timer.done, doneAnim, ring]);

  const remove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(exit, { toValue: 0, duration: t.motion.fast, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => onRemove());
  };

  const fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const cardOpacity = Animated.multiply(enter, exit);
  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const exitX = exit.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const flipY = flipIn.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.6, 0] });
  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 4] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  return (
    <Animated.View
      style={[s.card, { opacity: cardOpacity, transform: [{ translateY }, { translateX: exitX }] }]}
    >
      <View style={{ height: t.photoHeight }}>
        <FoodPhoto food={timer.food} zoom={timer.running} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(20,16,14,0.35)', 'rgba(20,16,14,0.15)', 'rgba(20,16,14,0.8)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c.accent, opacity: flash }]} />
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', alignSelf: 'center', top: '20%', width: 160, height: 160, borderRadius: 80, borderWidth: 3, borderColor: c.accent, opacity: haloOpacity, transform: [{ scale: haloScale }] }}
        />
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={[t.type.heading, styles.onPhoto]}>{timer.foodLabel}</Text>
            <Text style={[t.type.caption, styles.onPhotoMuted]}>
              {timer.thicknessLabel} · {timer.doneLabel}
            </Text>
          </View>
          <Pressable
            onPress={remove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${timer.foodLabel} timer`}
            style={({ pressed }) => [styles.closeBtn, pressed && s.btnPressed]}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.bottomRow}>
          <Text style={[t.type.timer, styles.onPhoto, styles.time]}>
            {timer.done ? 'Done!' : fmt(timer.remaining)}
          </Text>
          {timer.done && (
            <Animated.View
              pointerEvents="none"
              style={[styles.check, { position: 'absolute', right: 0, borderWidth: 2, borderColor: c.success, backgroundColor: 'transparent', opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
            />
          )}
          {timer.done && (
            <Animated.View
              style={[styles.check, { backgroundColor: c.success, opacity: doneAnim, transform: [{ scale: doneAnim }] }]}
            >
              <Ionicons name="checkmark" size={22} color="#fff" />
            </Animated.View>
          )}
        </View>
      </View>

      <View style={[styles.body, timer.done && { backgroundColor: c.successSoft }]}>
        <View style={[styles.track, { backgroundColor: c.line }]}>
          <Animated.View
            style={[styles.fill, { width: fillWidth, backgroundColor: timer.done ? c.success : c.accent }]}
          />
          {!timer.done && <View style={[styles.mark, { backgroundColor: c.inkMuted }]} />}
        </View>
        <View style={styles.controls}>
          <View style={{ flex: 1 }}>
            {timer.done ? (
              <Text style={[t.type.caption, { color: c.success }]}>Ready to serve</Text>
            ) : showFlip ? (
              <Animated.View
                style={[
                  styles.flipBadge,
                  { backgroundColor: c.accentSoft, opacity: flipIn, transform: [{ translateY: flipY }, { scale: pulseScale }] },
                ]}
              >
                <Ionicons name="sync" size={14} color={c.accent} />
                <Text style={[t.type.caption, { color: c.accent }]}>Flip it!</Text>
              </Animated.View>
            ) : (
              <Text style={[t.type.caption, { color: c.inkMuted }]}>Flip at {fmt(half)}</Text>
            )}
          </View>
          {!timer.done && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onToggle();
              }}
              accessibilityRole="button"
              accessibilityLabel={timer.running ? `Pause ${timer.foodLabel}` : `Resume ${timer.foodLabel}`}
              style={({ pressed }) => [s.iconBtn, s.iconBtnAccent, pressed && s.btnPressed]}
            >
              <Ionicons name={timer.running ? 'pause' : 'play'} size={20} color={c.accentInk} style={{ marginLeft: timer.running ? 0 : 2 }} />
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topRow: { position: 'absolute', top: tokens.space[3], left: tokens.space[4], right: tokens.space[3], flexDirection: 'row', alignItems: 'flex-start', gap: tokens.space[2] },
  bottomRow: { position: 'absolute', left: tokens.space[4], right: tokens.space[4], bottom: tokens.space[3], flexDirection: 'row', alignItems: 'center', gap: tokens.space[3] },
  onPhoto: { color: '#fff' },
  onPhotoMuted: { color: 'rgba(255,255,255,0.85)' },
  time: { minWidth: 120 },
  closeBtn: { width: tokens.hit, height: tokens.hit, borderRadius: tokens.radius.circle, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,16,14,0.45)' },
  check: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  body: { padding: tokens.space[4], gap: tokens.space[3] },
  track: { height: 8, borderRadius: 4, overflow: 'visible' },
  fill: { height: 8, borderRadius: 4 },
  mark: { position: 'absolute', left: '50%', top: -2, width: 2, height: 12, borderRadius: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[3], minHeight: tokens.hit },
  flipBadge: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[1], alignSelf: 'flex-start', paddingHorizontal: tokens.space[3], paddingVertical: tokens.space[1], borderRadius: tokens.radius.control },
});
