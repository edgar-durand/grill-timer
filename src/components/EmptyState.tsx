import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EmptyStateProps } from '../types';
import { useTheme, tokens } from '../theme';
import FoodPhoto from './FoodPhoto';

export default function EmptyState({ onAdd }: EmptyStateProps) {
  const { s } = useTheme();
  const { height } = useWindowDimensions();
  const photoH = Math.max(120, Math.min(tokens.photoHeight, Math.round(height * 0.28)));
  return (
    <View style={s.empty}>
      <View
        style={{
          width: '100%',
          maxWidth: 480,
          height: photoH,
          marginBottom: tokens.space[4],
          borderRadius: tokens.radius.card,
          overflow: 'hidden',
          ...tokens.elevation,
        }}
      >
        <FoodPhoto
          food="steak"
          zoom
          rounded={tokens.radius.card}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <Text style={s.emptyTitle}>Fire up the grill</Text>
      <Text style={s.emptyText}>Add your first item to start a countdown.</Text>
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add Item"
        style={({ pressed }) => [s.btn, s.btnPrimary, pressed && s.btnPressed]}
      >
        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
        <Text style={[s.btnPrimaryText, { flexShrink: 0 }]} numberOfLines={1}>
          Add Item
        </Text>
      </Pressable>
    </View>
  );
}
