import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme, tokens } from './src/theme';
import { useTimers } from './src/useTimers';
import Header from './src/components/Header';
import TimerCard from './src/components/TimerCard';
import EmptyState from './src/components/EmptyState';
import PickerSheet from './src/components/PickerSheet';
import type { TimerConfig } from './src/types';

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
    <SafeAreaView style={[s.screen, { backgroundColor: c.bg }]} edges={['top', 'bottom', 'left', 'right']}>
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
  );
}

const styles = StyleSheet.create({
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
