import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { File, Paths } from 'expo-file-system';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

type Note = { f: number; t: number; d: number };

const FLIP_NOTES: Note[] = [{ f: 880, t: 0, d: 0.22 }];
const DONE_NOTES: Note[] = [
  { f: 523.25, t: 0, d: 0.32 },
  { f: 659.25, t: 0.22, d: 0.32 },
  { f: 783.99, t: 0.44, d: 0.6 },
];

let audioModeSet = false;
let notifConfigured = false;
const fileCache: Record<string, File> = {};

function configureNotifications(): void {
  if (notifConfigured) return;
  notifConfigured = true;
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
  } catch {
    // ignore
  }
}

function totalDuration(notes: Note[]): number {
  return Math.max(...notes.map((n) => n.t + n.d)) + 0.1;
}

function playWeb(notes: Note[], volume: number): void {
  const Ctx =
    (globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ??
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const now = ctx.currentTime;
  notes.forEach((n) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = n.f;
    gain.gain.setValueAtTime(0, now + n.t);
    gain.gain.linearRampToValueAtTime(volume, now + n.t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + n.t);
    osc.stop(now + n.t + n.d + 0.05);
  });
  setTimeout(() => {
    ctx.close().catch(() => undefined);
  }, (totalDuration(notes) + 0.5) * 1000);
}

function buildWav(notes: Note[], volume: number): Uint8Array {
  const rate = 22050;
  const len = Math.floor(totalDuration(notes) * rate);
  const bytes = new Uint8Array(44 + len * 2);
  const dv = new DataView(bytes.buffer);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, 'RIFF');
  dv.setUint32(4, 36 + len * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true);
  dv.setUint32(28, rate * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  str(36, 'data');
  dv.setUint32(40, len * 2, true);
  for (let i = 0; i < len; i++) {
    const t = i / rate;
    let v = 0;
    for (const n of notes) {
      const lt = t - n.t;
      if (lt < 0 || lt > n.d) continue;
      const env = Math.min(1, lt / 0.03) * Math.pow(1 - lt / n.d, 2);
      v += Math.sin(2 * Math.PI * n.f * lt) * env;
    }
    const s = Math.max(-1, Math.min(1, v * volume));
    dv.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }
  return bytes;
}

async function playNative(key: string, notes: Note[], volume: number): Promise<void> {
  if (!audioModeSet) {
    audioModeSet = true;
    await setAudioModeAsync({ playsInSilentMode: true });
  }
  let file = fileCache[key];
  if (!file) {
    file = new File(Paths.cache, `grill-${key}.wav`);
    file.write(buildWav(notes, volume));
    fileCache[key] = file;
  }
  const player = createAudioPlayer({ uri: file.uri });
  player.play();
  setTimeout(() => {
    try {
      player.remove();
    } catch {
      // ignore
    }
  }, (totalDuration(notes) + 1) * 1000);
}

async function play(key: string, notes: Note[], volume: number): Promise<void> {
  try {
    if (Platform.OS === 'web') playWeb(notes, volume);
    else await playNative(key, notes, volume);
  } catch {
    // audio failure must never break the app
  }
}

export async function playFlipSound(): Promise<void> {
  await play('flip', FLIP_NOTES, 0.22);
}

export async function playDoneSound(): Promise<void> {
  await play('done', DONE_NOTES, 0.25);
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    configureNotifications();
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    if (!cur.canAskAgain) return false;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

async function schedule(title: string, body: string, seconds: number): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.ceil(seconds)),
    },
  });
}

export async function scheduleTimerNotifications(
  foodLabel: string,
  remaining: number,
  total: number,
): Promise<string[]> {
  if (Platform.OS === 'web' || remaining <= 0) return [];
  const ids: string[] = [];
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (!cur.granted) return [];
    configureNotifications();
    const untilFlip = remaining - total / 2;
    if (untilFlip > 1) {
      ids.push(await schedule(`¡Gira el ${foodLabel}!`, 'Es el momento de darle la vuelta.', untilFlip));
    }
    ids.push(await schedule(`${foodLabel} listo`, 'El tiempo se cumplió. A servir.', remaining));
  } catch {
    // ignore
  }
  return ids;
}

export async function cancelNotifications(ids: string[]): Promise<void> {
  if (Platform.OS === 'web') return;
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // ignore
    }
  }
}
