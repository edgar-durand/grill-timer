// Visual direction: premium restaurant grill. Large warm overhead food photography on warm dark/light surfaces,
// ember accent #E8571F. One system font family: titles 800 with negative tracking, body 500/600, timer digits 800 tabular.
// Comfortable density. Soft radius: 16 cards and sheet, 12 pills and buttons, circles only for action buttons. Follows system scheme.
import { useColorScheme, StyleSheet } from 'react-native';

const light = { bg: '#FAF6F1', surface: '#FFFFFF', ink: '#231C17', inkMuted: '#7C6E64', line: '#EADFD5', accent: '#E8571F', accentInk: '#FFFFFF', accentSoft: '#FCE8DC', success: '#4FA66A', successSoft: '#E6F3EA', warning: '#E9A23B', danger: '#D9534F', scrim: 'rgba(20,16,14,0.5)' };
const dark = { bg: '#14100E', surface: '#1F1A17', ink: '#F6EFE8', inkMuted: '#A39489', line: '#332B26', accent: '#E8571F', accentInk: '#FFFFFF', accentSoft: '#3A231A', success: '#4FA66A', successSoft: '#1D2E22', warning: '#E9A23B', danger: '#D9534F', scrim: 'rgba(0,0,0,0.6)' };
export type Colors = typeof light;

export const tokens = {
  colors: { light, dark },
  type: {
    display: { fontSize: 32, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.8 },
    title: { fontSize: 22, lineHeight: 28, fontWeight: '800' as const, letterSpacing: -0.4 },
    heading: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
    body: { fontSize: 15, lineHeight: 21, fontWeight: '500' as const },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
    label: { fontSize: 12, lineHeight: 16, fontWeight: '700' as const, letterSpacing: 0.8 },
    timer: { fontSize: 44, lineHeight: 48, fontWeight: '800' as const, letterSpacing: -1, fontVariant: ['tabular-nums'] as ['tabular-nums'] },
  },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40 },
  radius: { card: 16, sheet: 16, control: 12, circle: 999 },
  elevation: { shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  motion: { fast: 250, base: 320, slow: 400, photoZoom: 8000, pulse: 900 },
  hit: 44,
  photoHeight: 168,
};

export function useTheme() {
  const scheme = useColorScheme();
  const c: Colors = scheme === 'dark' ? dark : light;
  return { c, dark: scheme === 'dark', s: makeStyles(c) };
}

export function makeStyles(c: Colors) {
  const t = tokens;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    btn: { minHeight: 48, borderRadius: t.radius.control, paddingHorizontal: t.space[5], alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: t.space[2] },
    btnPrimary: { backgroundColor: c.accent },
    btnPrimaryText: { ...t.type.heading, color: c.accentInk },
    btnSecondary: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
    btnSecondaryText: { ...t.type.heading, color: c.ink },
    btnTertiary: { backgroundColor: 'transparent' },
    btnTertiaryText: { ...t.type.heading, color: c.accent },
    btnDanger: { backgroundColor: c.danger },
    btnPressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
    btnDisabled: { opacity: 0.4 },
    iconBtn: { width: t.hit, height: t.hit, borderRadius: t.radius.circle, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
    iconBtnAccent: { backgroundColor: c.accent, borderColor: c.accent },
    card: { backgroundColor: c.surface, borderRadius: t.radius.card, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: c.line, ...t.elevation },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: t.space[3], paddingVertical: t.space[3] },
    input: { minHeight: 48, borderRadius: t.radius.control, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, paddingHorizontal: t.space[4], color: c.ink },
    inputError: { borderColor: c.danger },
    chip: { minHeight: 44, paddingHorizontal: t.space[4], borderRadius: t.radius.control, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
    chipActive: { backgroundColor: c.accentSoft, borderColor: c.accent },
    chipText: { ...t.type.caption, fontSize: 14, color: c.inkMuted },
    chipTextActive: { color: c.accent },
    tabItem: { minHeight: t.hit, alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.space[4] },
    tabItemActive: { borderBottomWidth: 2, borderBottomColor: c.accent },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.space[8], gap: t.space[2] },
    emptyTitle: { ...t.type.title, color: c.ink, textAlign: 'center' },
    emptyText: { ...t.type.body, color: c.inkMuted, textAlign: 'center', marginBottom: t.space[4] },
    skeleton: { backgroundColor: c.line, borderRadius: t.radius.control },
    toast: { position: 'absolute', left: t.space[4], right: t.space[4], bottom: t.space[6], backgroundColor: c.ink, borderRadius: t.radius.control, padding: t.space[4] },
    toastText: { ...t.type.caption, color: c.bg },
    sectionLabel: { ...t.type.label, color: c.inkMuted, marginTop: t.space[4], marginBottom: t.space[2] },
  });
}
