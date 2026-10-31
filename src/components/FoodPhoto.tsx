import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, AccessibilityInfo } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { FoodPhotoProps } from '../types';
import { tokens } from '../theme';
import { FOODS } from '../foods';

export default function FoodPhoto({ food, style, zoom, rounded }: FoodPhotoProps) {
  const item = FOODS.find((f) => f.key === food) ?? FOODS[0];
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!zoom) return;
    let anim: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce) return;
      anim = Animated.timing(scale, {
        toValue: 1.12,
        duration: tokens.motion.photoZoom,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      });
      anim.start();
    }).catch(() => {});
    return () => {
      cancelled = true;
      anim?.stop();
    };
  }, [zoom, scale]);

  const radius = rounded ?? 0;
  const showFallback = failed || !loaded;

  return (
    <View
      style={[{ overflow: 'hidden', borderRadius: radius, backgroundColor: item.tint }, style]}
      accessibilityLabel={`${item.label} photo`}
    >
      <LinearGradient
        colors={[item.tint, '#E8571F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {showFallback && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={styles.initial}>{item.label.charAt(0)}</Text>
        </View>
      )}
      {!failed && (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}>
          <Image
            source={{ uri: item.photoUrl }}
            accessibilityLabel={`${item.label} photo`}
            alt={`${item.label} photo`}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={400}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 48, fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: -1 },
});
