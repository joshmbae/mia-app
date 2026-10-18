// ─── Clay-Grundbausteine: Karte, Knopf, runder Icon-Knopf, Pille ─────────────

import React, { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, ctaShadow, elevation, radius, size, solid, space } from "../../utils/theme";
import { tap } from "../../utils/haptics";
import { T } from "./T";

type IconName = keyof typeof Ionicons.glyphMap;
type Elevation = keyof typeof elevation;

// ─── Federnder Druck ──────────────────────────────────────────────────────────

/**
 * Pressable, das beim Drücken leicht einsinkt und zurückfedert. Haptik nur,
 * wenn ausdrücklich gewünscht (Hauptaktionen) — nicht bei jedem Chip.
 */
export function Squish({
  style,
  children,
  onPress,
  haptic = false,
  disabled,
  ...rest
}: Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  haptic?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, friction: 6, tension: 280, useNativeDriver: true }).start();
  // Eigene Transformationen (z. B. leichte Drehung) bleiben erhalten, die Skalierung kommt dazu
  const flat = StyleSheet.flatten(style) ?? {};
  const own = Array.isArray(flat.transform) ? flat.transform : [];
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled, ...(rest.accessibilityState ?? {}) }}
      onPressIn={() => to(0.96)}
      onPressOut={() => to(1)}
      onPress={(e) => {
        if (haptic) tap();
        onPress?.(e);
      }}
      style={[flat, { transform: [...own, { scale }] }]}
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
  lift = "raised",
  onPress,
  accessibilityLabel,
  // Ältere Props — werden ignoriert, Schatten kommen jetzt aus `lift`
  glow: _glow,
  strength,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  color?: string;
  lift?: Elevation;
  onPress?: () => void;
  accessibilityLabel?: string;
  glow?: string;
  strength?: "soft" | "normal" | "strong";
}) {
  const level: Elevation = strength === "strong" ? "float" : lift;
  const base = [styles.card, { backgroundColor: color }, elevation[level], style];
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

/**
 * solid: der Hauptknopf (dunkle Füllfarbe, weiße Schrift, farbiger Schatten)
 * soft:  weißer Knopf mit farbiger Schrift
 * ghost: nur Schrift
 */
export function ClayButton({
  label,
  onPress,
  icon,
  color = colors.coral,
  variant = "solid",
  size: sz = "lg",
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
  const off = disabled && !loading;
  const fill = solid(color);
  const fg = off ? colors.muted : variant === "solid" ? colors.onAccent : variant === "soft" ? fill : fill;
  const bg = off ? colors.line : variant === "solid" ? fill : variant === "soft" ? colors.surface : "transparent";
  const shadow = off || variant === "ghost" ? null : variant === "solid" ? ctaShadow(color) : elevation.raised;
  return (
    <Squish
      onPress={onPress}
      disabled={disabled || loading}
      haptic={variant === "solid"}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.button, { height: sz === "md" ? size.buttonSm : size.button, backgroundColor: bg }, shadow, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={sz === "md" ? size.icon.sm : size.icon.md} color={fg} />}
          <T variant={sz === "md" ? "buttonSm" : "button"} color={fg} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={{ flexShrink: 1 }}>
            {label}
          </T>
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
      hitSlop={4}
      style={[styles.iconButton, { backgroundColor: background }, elevation.raised, style]}
    >
      <Ionicons name={icon} size={size.icon.md} color={color} />
    </Squish>
  );
}

// ─── Pille ────────────────────────────────────────────────────────────────────

/** Kleines Etikett. Ohne Angabe in Minze; `color` ist die Akzentfarbe. */
export function Pill({
  label,
  color = colors.mint,
  background,
  icon,
  center,
  style,
}: {
  label: string;
  color?: string;
  background?: string;
  icon?: IconName;
  center?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = solid(color);
  return (
    <View style={[styles.pill, { backgroundColor: background ?? colors.surfaceSoft, alignSelf: center ? "center" : "flex-start" }, style]}>
      {icon && <Ionicons name={icon} size={14} color={fg} />}
      <T variant="chip" color={fg} numberOfLines={1} style={{ flexShrink: 1 }}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.md },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
  },
  iconButton: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xxs + 2,
    minHeight: size.pill,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    maxWidth: "100%",
  },
});
