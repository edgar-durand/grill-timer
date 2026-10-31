import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, tokens } from './src/theme';
import { useTimers } from './src/useTimers';
import Header from './src/components/Header';
import TimerCard from './src/components/TimerCard';
import EmptyState from './src/components/EmptyState';
import PickerSheet from './src/components/PickerSheet';
import FireBackground from './src/components/FireBackground';
import type { TimerConfig, FireState } from './src/types';

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const { s, dark, c } = useTheme();
  const { timers, addTimer, removeTimer, toggleRunning, confirmFlip } = useTimers();
  const [showPicker, setShowPicker] = useState(false);

  const { fireState, flare } = useMemo<{ fireState: FireState; flare: boolean }>(() => {
    if (timers.length === 0) return { fireState: 'off', flare: false };
    const active = timers.filter((t) => !t.done);
    if (active.length === 0) return { fireState: 'ashes', flare: false };
    const awaiting = active.some((t) => t.awaitingFlip);
    const burning = active.some((t) => t.running || t.awaitingFlip);
    return { fireState: burning ? 'burning' : 'low', flare: awaiting };
  }, [timers]);

  const open = useCallback(() => setShowPicker(true), []);
  const close = useCallback(() => setShowPicker(false), []);
  const confirm = useCallback(
    (cfg: TimerConfig) => {
      addTimer(cfg);
      setShowPicker(false);
    },
    [addTimer]
  );

  return (
    <View style={styles.root}>
    <View
      pointerEvents="none"
      style={[styles.fire, { backgroundColor: c.bg }]}
    >
      <FireBackground state={fireState} flare={flare} />
    </View>
    <SafeAreaView
      style={[s.screen, { backgroundColor: 'transparent' }]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Header count={timers.length} onAdd={open} />
      {timers.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyWrap}
          showsVerticalScrollIndicator={false}
        >
          <EmptyState onAdd={open} />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {timers.map((t) => (
            <TimerCard
              key={t.id}
              timer={t}
              onToggle={() => toggleRunning(t.id)}
              onRemove={() => removeTimer(t.id)}
              onConfirmFlip={() => confirmFlip(t.id)}
            />
          ))}
        </ScrollView>
      )}
      {showPicker && <PickerSheet onCancel={close} onConfirm={confirm} />}
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fire: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    overflow: 'hidden',
  },
  flex: { flex: 1 },
  emptyWrap: { flexGrow: 1 },
  list: {
    paddingHorizontal: tokens.space[4],
    paddingBottom: tokens.space[7] + tokens.space[4],
    gap: tokens.space[4],
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
});
