import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { Timer, TimerConfig, TimerStore } from './types';
import { playFlipSound, playDoneSound } from './alerts';
import { computeSeconds, halfPoint } from './timing';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {}

function wavUri(notes: number[], dur: number, vol: number): string {
  const rate = 22050;
  const per = Math.floor(rate * dur);
  const n = per * notes.length;
  const buf = new Uint8Array(44 + n * 2);
  const dv = new DataView(buf.buffer);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, 'RIFF');
  dv.setUint32(4, 36 + n * 2, true);
  w(8, 'WAVEfmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true);
  dv.setUint32(28, rate * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  w(36, 'data');
  dv.setUint32(40, n * 2, true);
  notes.forEach((f, k) => {
    for (let i = 0; i < per; i++) {
      const env = Math.min(1, i / 400) * Math.pow(1 - i / per, 1.5);
      const v = Math.sin((2 * Math.PI * f * i) / rate) * env * vol;
      dv.setInt16(44 + (k * per + i) * 2, Math.round(v * 32767), true);
    }
  });
  let bin = '';
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return 'data:audio/wav;base64,' + btoa(bin);
}

function play(kind: 'flip' | 'done') {
  try {
    (kind === 'flip' ? playFlipSound() : playDoneSound()).catch(() => {});
  } catch {}
}

async function schedule(t: Timer): Promise<string[]> {
  const ids: string[] = [];
  if (Platform.OS === 'web') return ids;
  try {
    const half = halfPoint(t.total);
    if (!t.flipped && t.remaining - half > 1) {
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content: { title: `¡Gira el ${t.foodLabel}!`, body: 'Es el momento de darle la vuelta.' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: t.remaining - half, repeats: false },
        }),
      );
    }
    if (t.remaining > 1) {
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content: { title: `${t.foodLabel} listo`, body: `${t.thicknessLabel} · ${t.doneLabel}` },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: t.remaining, repeats: false },
        }),
      );
    }
  } catch {}
  return ids;
}

async function ensurePermission() {
  if (Platform.OS === 'web') return;
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (!cur.granted && cur.canAskAgain) await Notifications.requestPermissionsAsync();
  } catch {}
}

export function useTimers(): TimerStore {
  const [timers, setTimers] = useState<Timer[]>([]);
  const idRef = useRef(1);
  const timersRef = useRef<Timer[]>([]);
  timersRef.current = timers;
  const notifRef = useRef<Record<number, string[]>>({});

  const cancel = useCallback((id: number) => {
    const ids = notifRef.current[id] || [];
    delete notifRef.current[id];
    ids.forEach((n) => Notifications.cancelScheduledNotificationAsync(n).catch(() => {}));
  }, []);

  const arm = useCallback(
    (t: Timer) => {
      cancel(t.id);
      schedule(t).then((ids) => {
        const cur = timersRef.current.find((x) => x.id === t.id);
        if (!cur && timersRef.current.length > 0 ? true : false) {
          ids.forEach((n) => Notifications.cancelScheduledNotificationAsync(n).catch(() => {}));
          return;
        }
        notifRef.current[t.id] = ids;
      });
    },
    [cancel],
  );

  const addTimer = useCallback((cfg: TimerConfig) => {
    const seconds = computeSeconds(cfg.food, cfg.thickness, cfg.doneMult);
    const t: Timer = {
      id: idRef.current++,
      food: cfg.food,
      foodLabel: cfg.foodLabel,
      thicknessLabel: cfg.thicknessLabel,
      doneLabel: cfg.doneLabel,
      total: seconds,
      remaining: seconds,
      running: true,
      flipped: false,
      done: false,
    };
    setTimers((prev) => [t, ...prev]);
    ensurePermission().then(() => arm(t));
  }, [arm]);

  const removeTimer = useCallback((id: number) => {
    cancel(id);
    setTimers((prev) => prev.filter((x) => x.id !== id));
  }, [cancel]);

  const toggleRunning = useCallback((id: number) => {
    const t = timersRef.current.find((x) => x.id === id);
    if (t && !t.done) {
      if (t.running) cancel(id);
      else arm(t);
    }
    setTimers((prev) => prev.map((x) => (x.id === id ? { ...x, running: !x.running } : x)));
  }, [arm, cancel]);

  useEffect(() => {
    const interval = setInterval(() => {
      let warn = false;
      let finish = false;
      for (const t of timersRef.current) {
        if (!t.running || t.done) continue;
        const remaining = t.remaining - 1;
        if (remaining <= 0) finish = true;
        else if (!t.flipped && remaining <= halfPoint(t.total)) warn = true;
      }
      setTimers((prev) => {
        let changed = false;
        const next = prev.map((t) => {
          if (!t.running || t.done) return t;
          changed = true;
          const remaining = t.remaining - 1;
          if (remaining <= 0) {
            return { ...t, remaining: 0, running: false, done: true, flipped: true };
          }
          if (!t.flipped && remaining <= halfPoint(t.total)) {
            return { ...t, remaining, flipped: true };
          }
          return { ...t, remaining };
        });
        return changed ? next : prev;
      });
      if (warn) {
        play('flip');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        if (Platform.OS === 'android') Vibration.vibrate([0, 200, 100, 200]);
      }
      if (finish) {
        play('done');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        if (Platform.OS === 'android') Vibration.vibrate([0, 300, 100, 300, 100, 300]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { timers, addTimer, removeTimer, toggleRunning };
}
