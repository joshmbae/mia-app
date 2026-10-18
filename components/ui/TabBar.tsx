// ─── Schwebende, runde Tab-Leiste ────────────────────────────────────────────
// Beschriftungen sind immer sichtbar (HIG/Material). Hinter der Leiste blendet
// ein weicher Verlauf den Inhalt aus. Ohne Kind gibt es keine Leiste.

import React from "react";
import { StyleSheet, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, elevation, radius, size, soft, solid, space, tint } from "../../utils/theme";
import { useFamily } from "../../utils/family";
import { Squish } from "./Clay";
import { T } from "./T";

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap; label: string }> = {
  start: { on: "home", off: "home-outline", label: "Start" },
  zeitstrahl: { on: "map", off: "map-outline", label: "Weg" },
  wachstum: { on: "trending-up", off: "trending-up-outline", label: "Wachstum" },
  buch: { on: "book", off: "book-outline", label: "Buch" },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { active } = useFamily();
  if (!active) return null;
  const accent = active.color;
  const bottom = Math.max(insets.bottom, 14);

  return (
    <View style={[styles.wrap, { height: bottom + size.tabBar + space.xl }]} pointerEvents="box-none">
      <LinearGradient
        colors={[tint(colors.bg, 0), colors.bg]}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.bar, { bottom }, elevation.float]} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const meta = ICONS[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          return (
            <Squish
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={[styles.item, focused && { backgroundColor: soft(accent) }]}
            >
              <Ionicons name={focused ? meta.on : meta.off} size={size.icon.md} color={focused ? solid(accent) : colors.muted} />
              <T variant="caption" color={focused ? solid(accent) : colors.muted} numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.label}>
                {meta.label}
              </T>
            </Squish>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center" },
  bar: {
    position: "absolute",
    left: space.gutter,
    right: space.gutter,
    maxWidth: 480,
    alignSelf: "center",
    height: size.tabBar,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: space.xs - 2,
    gap: space.xxs,
  },
  item: {
    flex: 1,
    height: size.tabBar - 12,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: { fontFamily: "Nunito_800ExtraBold" },
});
