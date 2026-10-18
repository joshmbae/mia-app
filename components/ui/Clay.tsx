// ─── Clay-Grundbausteine: Karte, Knopf, runder Icon-Knopf, Pille ─────────────

import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, clay, clayButton, fonts, radius } from "../../utils/theme";
import { tap } from "../../utils/haptics";

type IconName = keyof typeof Ionicons.glyphMap;

// ─── Federnder Druck ──────────────────────────────────────────────────────────

/** Pressable, das beim Drücken leicht einsinkt und zurückfedert */
export function Squish({
  style,
  children,
  onPress,
  haptic = true,
  disabled,
  ...rest
}: Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  haptic?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, friction: 5, tension: 260, useNativeDriver: true }).start();
  // Eigene Transformationen (z. B. leichte Drehung) bleiben erhalten, die Skalierung kommt dazu
  const flat = StyleSheet.flatten(style) ?? {};
  const own = Array.isArray(flat.transform) ? flat.transform : [];
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={() => to(0.95)}
      onPressOut={() => to(1)}
      onPress={(e) => {
        if (haptic) tap();
        onPress?.(e);
      }}
      style={[flat, { transform: [...own, { scale }] }, disabled && { opacity: 0.5 }]}
    >
      {children}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Karte ────────────────────────────────────────────────────────────────────

export function ClayCard({
  children,
  style,
  color = colors.surface,
  glow = colors.coral,
  strength = "normal",
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  color?: string;
  glow?: string;
  strength?: "soft" | "normal" | "strong";
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const base = [styles.card, { backgroundColor: color }, clay(glow, strength), style];
  if (onPress) {
    return (
      <Squish style={base} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        {children}
      </Squish>
    );
  }
  return <View style={base}>{children}</View>;
}

// ─── Knopf ────────────────────────────────────────────────────────────────────

export function ClayButton({
  label,
  onPress,
  icon,
  color = colors.coral,
  variant = "solid",
  size = "lg",
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  color?: string;
  variant?: "solid" | "soft" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const solid = variant === "solid";
  const fg = solid ? colors.onAccent : variant === "soft" ? colors.ink : color;
  const bg = solid ? color : variant === "soft" ? colors.surface : "transparent";
  return (
    <Squish
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.button,
        size === "md" ? styles.buttonMd : styles.buttonLg,
        { backgroundColor: bg },
        solid ? clayButton(color) : variant === "soft" ? clay(color, "soft") : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === "md" ? 18 : 22} color={fg} />}
          <Text style={[styles.buttonText, size === "md" && styles.buttonTextMd, { color: fg }]}>{label}</Text>
        </>
      )}
    </Squish>
  );
}

// ─── Runder Icon-Knopf ────────────────────────────────────────────────────────

export function IconButton({
  icon,
  onPress,
  label,
  color = colors.ink,
  background = colors.surface,
  size = 44,
  style,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  background?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Squish
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background, alignItems: "center", justifyContent: "center" },
        clay(colors.coral, "soft"),
        style,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.46)} color={color} />
    </Squish>
  );
}

// ─── Pille ────────────────────────────────────────────────────────────────────

export function Pill({
  label,
  color = colors.mintDeep,
  background = colors.mintSoft,
  icon,
  style,
}: {
  label: string;
  color?: string;
  background?: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: background }, style]}>
      {icon && <Ionicons name={icon} size={13} color={color} />}
      <Text style={[styles.pillText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 16 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
  },
  buttonLg: { height: 60 },
  buttonMd: { height: 48, paddingHorizontal: 18 },
  buttonText: { fontFamily: fonts.display, fontSize: 19 },
  buttonTextMd: { fontSize: 16 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: "100%",
  },
  pillText: { fontFamily: fonts.bodyHeavy, fontSize: 13 },
});
