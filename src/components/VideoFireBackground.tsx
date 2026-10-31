import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';

type VideoFireBackgroundProps = {
  /** Fire state: running/burning = bright, paused = dim, off/done = hidden. */
  state?: string;
  /** Called when the video cannot be shown (offline, error, reduced motion). */
  onFail?: () => void;
};

const VIDEO_ID = '-VGQxQHLXEI';
const HOST = 'https://www.youtube-nocookie.com';
const PARAMS = [
  'autoplay=1',
  'mute=1',
  'loop=1',
  `playlist=${VIDEO_ID}`,
  'controls=0',
  'modestbranding=1',
  'disablekb=1',
  'playsinline=1',
  'rel=0',
  'fs=0',
  'iv_load_policy=3',
  'cc_load_policy=0',
].join('&');
const EMBED_URL = `${HOST}/embed/${VIDEO_ID}?${PARAMS}${
  Platform.OS === 'web' ? '' : `&origin=${encodeURIComponent(HOST)}`
}`;

const RATIO = 16 / 9;
const OVERSCAN = 1.18; // enlarge a little to hide any edge UI of the player
const FADE_MS = 800;
const DIM_LEVEL = 0.45;

function levelFor(state?: string): number {
  const s = (state ?? 'off').toLowerCase();
  if (/pause|dim|low|hold/.test(s)) return DIM_LEVEL;
  if (/off|none|idle|out|done|finish|end|empty|stop/.test(s)) return 0;
  return 1;
}

const HTML = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;pointer-events:none}</style></head><body><iframe src="${EMBED_URL}" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" tabindex="-1"></iframe></body></html>`;

export default function VideoFireBackground({ state, onFail }: VideoFireBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const failRef = useRef(onFail);
  failRef.current = onFail;

  const level = levelFor(state);
  const online = Platform.OS !== 'web' || typeof navigator === 'undefined' || navigator.onLine !== false;
  const blocked = reduceMotion || failed || !online;

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduceMotion(!!v);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduceMotion(!!v));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (blocked) failRef.current?.();
  }, [blocked]);

  // Mount while visible or fading out; unmount afterwards to stop playback.
  useEffect(() => {
    if (blocked) {
      setMounted(false);
      return;
    }
    if (level > 0) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => {
      setMounted(false);
      setLoaded(false);
    }, FADE_MS + 100);
    return () => clearTimeout(t);
  }, [level, blocked]);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: loaded && !blocked ? level : 0,
      duration: FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [level, loaded, blocked, opacity]);

  const box = useMemo(() => {
    let vw: number;
    let vh: number;
    if (width / Math.max(height, 1) > RATIO) {
      vw = width;
      vh = width / RATIO;
    } else {
      vh = height;
      vw = height * RATIO;
    }
    vw *= OVERSCAN;
    vh *= OVERSCAN;
    return { width: vw, height: vh, left: (width - vw) / 2, top: (height - vh) / 2 };
  }, [width, height]);

  const fail = () => setFailed(true);

  const videoStyle = {
    position: 'absolute' as const,
    width: box.width,
    height: box.height,
    left: box.left,
    top: box.top,
  };

  return (
    <View pointerEvents="none" style={styles.root} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {(blocked || !loaded || level === 0) && (
        <LinearGradient
          colors={['#1a0a05', '#3a1508', '#6b2a0e']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {mounted && !blocked && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
          {Platform.OS === 'web' ? (
            React.createElement('iframe', {
              src: EMBED_URL,
              title: 'Fondo de fuego',
              tabIndex: -1,
              allow: 'autoplay; encrypted-media',
              referrerPolicy: 'strict-origin-when-cross-origin',
              onLoad: () => setLoaded(true),
              onError: fail,
              style: {
                ...videoStyle,
                border: 0,
                pointerEvents: 'none',
                background: '#000',
              },
            })
          ) : (
            <View pointerEvents="none" style={videoStyle}>
              <WebView
                pointerEvents="none"
                source={{ html: HTML, baseUrl: HOST }}
                originWhitelist={['*']}
                style={styles.web}
                scrollEnabled={false}
                bounces={false}
                javaScriptEnabled
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                allowsFullscreenVideo={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                onLoadEnd={() => setLoaded(true)}
                onError={fail}
                onHttpError={fail}
              />
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
