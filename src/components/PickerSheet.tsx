import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing, StyleSheet, AccessibilityInfo, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PickerSheetProps, Food, Thickness, Doneness, FoodCategory } from '../types';
import { useTheme, tokens } from '../theme';
import { FOODS, THICKNESS, DONENESS } from '../foods';
import { computeSeconds, fmt, halfPoint } from '../timing';
import FoodPhoto from './FoodPhoto';

type CategoryFilter = 'all' | FoodCategory;
const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'meat', label: 'Carnes' },
  { key: 'poultry', label: 'Aves' },
  { key: 'fish', label: 'Pescados' },
  { key: 'seafood', label: 'Mariscos' },
  { key: 'veg', label: 'Verduras' },
  { key: 'other', label: 'Otros' },
];

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress(): void }) {
  const { s } = useTheme();
  const scale = useRef(new Animated.Value(active ? 1 : 0.97)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: active ? 1.04 : 1, useNativeDriver: true, friction: 6 }).start();
  }, [active, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
        onPress={onPress}
        style={({ pressed }) => [s.chip, active && s.chipActive, pressed && s.btnPressed]}
      >
        <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function FoodTile({ food, active, width, onPress }: { food: Food; active: boolean; width: number; onPress(): void }) {
  const { c } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: active ? 1.03 : 1, useNativeDriver: true, friction: 6 }).start();
  }, [active, scale]);
  return (
    <Animated.View style={{ width, transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={food.label}
        accessibilityState={{ selected: active }}
        onPress={onPress}
        style={({ pressed }) => [
          st.tile,
          { borderColor: active ? c.accent : 'transparent' },
          pressed && { opacity: 0.85 },
        ]}
      >
        <FoodPhoto food={food.key} rounded={tokens.radius.control} style={StyleSheet.absoluteFill} />
        <View style={st.tileShade} />
        <Text style={st.tileLabel}>{food.label}</Text>
        {active && (
          <View style={[st.tick, { backgroundColor: c.accent }]}>
            <Ionicons name="checkmark" size={16} color={c.accentInk} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function PickerSheet({ onCancel, onConfirm }: PickerSheetProps) {
  const { c, s } = useTheme();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [food, setFood] = useState<Food | null>(null);
  const [thickness, setThickness] = useState<Thickness | null>(null);
  const [done, setDone] = useState<Doneness | null>(null);
  const [closing, setClosing] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const progress = useRef(new Animated.Value(0)).current;
  const summary = useRef(new Animated.Value(0)).current;
  const reduce = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduce.current = v; }).catch(() => {});
    Animated.timing(progress, { toValue: 1, duration: tokens.motion.base, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [progress]);

  const ready = !!(food && thickness && done);
  useEffect(() => {
    Animated.timing(summary, { toValue: ready ? 1 : 0, duration: tokens.motion.fast, useNativeDriver: true }).start();
  }, [ready, summary]);

  const close = useCallback((after: () => void) => {
    if (closing) return;
    setClosing(true);
    Animated.timing(progress, { toValue: 0, duration: tokens.motion.fast, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => after());
  }, [closing, progress]);

  const pickFood = (f: Food) => {
    Haptics.selectionAsync().catch(() => {});
    if (food?.key !== f.key) setDone(null);
    setFood(f);
  };

  const total = ready ? computeSeconds(food!.key, thickness!.key, done!.mult) : 0;
  const innerW = Math.min(width - insets.left - insets.right, 600) - tokens.space[5] * 2;
  const tileW = (innerW - tokens.space[2]) / 2;
  const options = food ? DONEESS_OF(food) : [];
  const visibleFoods = category === 'all' ? FOODS : FOODS.filter((f) => f.category === category);

  const confirm = () => {
    if (!ready || closing) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const cfg = {
      food: food!.key, foodLabel: food!.label,
      thickness: thickness!.key, thicknessLabel: thickness!.label,
      doneMult: done!.mult, doneLabel: done!.label,
    };
    close(() => onConfirm(cfg));
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim, opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close" onPress={() => close(onCancel)} />
      </Animated.View>
      <View style={[st.bottom, { paddingLeft: insets.left, paddingRight: insets.right }]} pointerEvents="box-none">
        <Animated.View
          style={[
            st.sheet,
            { backgroundColor: c.surface, maxHeight: height - insets.top - tokens.space[3], transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height * 0.6, 0] }) }] },
          ]}
        >
            <ScrollView
              style={{ flexShrink: 1, flexGrow: 0 }}
              showsVerticalScrollIndicator={false}
              bounces
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: tokens.space[5], paddingBottom: tokens.space[5] + insets.bottom + tokens.space[4] }}
            >
              <Text style={[tokens.type.title, { color: c.ink }]}>Add to Grill</Text>

              <Text style={s.sectionLabel}>FOOD</Text>
              <View style={[st.row, { marginBottom: tokens.space[3] }]}>
                {CATEGORIES.map((cat) => (
                  <Pill
                    key={cat.key}
                    label={cat.label}
                    active={category === cat.key}
                    onPress={() => { Haptics.selectionAsync().catch(() => {}); setCategory(cat.key); }}
                  />
                ))}
              </View>
              <View style={st.grid}>
                {visibleFoods.map((f) => (
                  <FoodTile key={f.key} food={f} width={tileW} active={food?.key === f.key} onPress={() => pickFood(f)} />
                ))}
              </View>
              {visibleFoods.length === 0 && (
                <Text style={[tokens.type.body, { color: c.inkMuted }]}>No hay alimentos en esta categoría</Text>
              )}

              <Text style={s.sectionLabel}>THICKNESS</Text>
              <View style={st.row}>
                {THICKNESS.map((t) => (
                  <Pill key={t.key} label={t.label} active={thickness?.key === t.key} onPress={() => { Haptics.selectionAsync().catch(() => {}); setThickness(t); }} />
                ))}
              </View>

              <Text style={s.sectionLabel}>DONENESS</Text>
              {!food ? (
                <Text style={[tokens.type.body, { color: c.inkMuted }]}>Pick a food first</Text>
              ) : (
                <View style={st.row}>
                  {options.map((d) => (
                    <Pill key={d.key} label={d.label} active={done?.key === d.key} onPress={() => { Haptics.selectionAsync().catch(() => {}); setDone(d); }} />
                  ))}
                </View>
              )}

              <Animated.View
                style={[st.summary, { backgroundColor: c.accentSoft, opacity: summary }]}
                pointerEvents="none"
              >
                <Ionicons name="time-outline" size={18} color={c.accent} />
                <Text style={[tokens.type.caption, { color: c.ink, flexShrink: 1 }]}>
                  {ready ? `${fmt(total)} total · flip at ${fmt(halfPoint(total))}` : ' '}
                </Text>
              </Animated.View>

              <View style={st.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  onPress={() => close(onCancel)}
                  style={({ pressed }) => [s.btn, s.btnSecondary, { flex: 1 }, pressed && s.btnPressed]}
                >
                  <Text style={s.btnSecondaryText} numberOfLines={1}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Start Timer"
                  accessibilityState={{ disabled: !ready }}
                  disabled={!ready}
                  onPress={confirm}
                  style={({ pressed }) => [s.btn, s.btnPrimary, { flex: 2 }, !ready && s.btnDisabled, pressed && ready && s.btnPressed]}
                >
                  <Text style={s.btnPrimaryText} numberOfLines={1}>Start Timer</Text>
                </Pressable>
              </View>
            </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

function DONEESS_OF(food: Food): Doneness[] {
  return DONENESS[food.key];
}

const st = StyleSheet.create({
  bottom: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%', maxWidth: 600,
    borderTopLeftRadius: tokens.radius.sheet, borderTopRightRadius: tokens.radius.sheet,
    overflow: 'hidden',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space[2] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space[2] },
  tile: {
    height: 96, borderRadius: tokens.radius.control, overflow: 'hidden',
    borderWidth: 2, justifyContent: 'flex-end',
  },
  tileShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,16,14,0.28)' },
  tileLabel: { ...tokens.type.heading, color: '#FFFFFF', padding: tokens.space[3] },
  tick: {
    position: 'absolute', top: tokens.space[2], right: tokens.space[2],
    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row', alignItems: 'center', gap: tokens.space[2],
    marginTop: tokens.space[4], padding: tokens.space[3], borderRadius: tokens.radius.control, minHeight: 44,
  },
  actions: { flexDirection: 'row', gap: tokens.space[3], marginTop: tokens.space[5] },
});
