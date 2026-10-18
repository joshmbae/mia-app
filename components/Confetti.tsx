// ─── Konfetti-Regen zum Feiern eines neuen Moments ───────────────────────────

import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from "react-native";
import { colors } from "../utils/theme";
import { useReduceMotion } from "../utils/a11y";

const PIECES = 28;
const PALETTE = [colors.coral, colors.sun, colors.sky, colors.mint, colors.lilac, colors.pink];

export function Confetti({ onDone }: { onDone?: () => void }) {
  const reduceMotion = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const pieces = useRef(
    Array.from({ length: PIECES }, (_, i) => ({
      x: Math.random() * width,
      drift: (Math.random() - 0.5) * 120,
      size: 8 + Math.random() * 8,
      round: i % 3 !== 0,
      color: PALETTE[i % PALETTE.length],
      delay: Math.random() * 300,
      progress: new Animated.Value(0),
      spin: Math.random() > 0.5 ? 1 : -1,
    }))
  ).current;

  useEffect(() => {
    if (reduceMotion) {
      onDone?.();
      return;
    }
    const anim = Animated.parallel(
      pieces.map((p) =>
        Animated.timing(p.progress, {
          toValue: 1,
          duration: 1800 + Math.random() * 700,
          delay: p.delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      )
    );
    anim.start(({ finished }) => finished && onDone?.());
    return () => anim.stop();
  }, [reduceMotion]);

  if (reduceMotion) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: -20,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            borderRadius: p.round ? p.size / 2 : 2,
            backgroundColor: p.color,
            opacity: p.progress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.75] }) },
              { translateX: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: p.progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.spin * 540}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
