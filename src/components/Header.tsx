import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { HeaderProps } from '../types';
import { useTheme, tokens } from '../theme';

export default function Header({ count, onAdd }: HeaderProps) {
  const { c, s } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: tokens.space[5],
        paddingTop: tokens.space[3],
        paddingBottom: tokens.space[4],
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[tokens.type.display, { color: c.ink }]}>Grill Timer</Text>
        <Text style={[tokens.type.body, { color: c.inkMuted, marginTop: tokens.space[1] }]}>
          {count === 0
            ? 'Nothing on the grill yet'
            : `${count} item${count > 1 ? 's' : ''} cooking`}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          onAdd();
        }}
        accessibilityRole="button"
        accessibilityLabel="Add item"
        style={({ pressed }) => [s.iconBtn, s.iconBtnAccent, pressed && s.btnPressed]}
      >
        <Ionicons name="add" size={26} color={c.accentInk} />
      </Pressable>
    </View>
  );
}
