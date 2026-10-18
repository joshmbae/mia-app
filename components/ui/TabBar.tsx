// ─── Schwebende, runde Tab-Leiste ────────────────────────────────────────────

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, clay, fonts } from "../../utils/theme";
import { useFamily } from "../../utils/family";
import { Squish } from "./Clay";

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap; label: string }> = {
  start: { on: "home", off: "home-outline", label: "Start" },
  zeitstrahl: { on: "trail-sign", off: "trail-sign-outline", label: "Weg" },
  wachstum: { on: "resize", off: "resize-outline", label: "Wachstum" },
  buch: { on: "book", off: "book-outline", label: "Buch" },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { active } = useFamily();
  const accent = active?.color ?? colors.coral;

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 14) }]} pointerEvents="box-none">
      <View style={[styles.bar, clay(colors.ink, "soft")]}>
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
              style={[styles.item, focused && { backgroundColor: accent }]}
            >
              <Ionicons name={focused ? meta.on : meta.off} size={22} color={focused ? colors.onAccent : colors.muted} />
              {focused && <Text style={styles.label}>{meta.label}</Text>}
            </Squish>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 20, right: 20, alignItems: "center" },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 36,
    padding: 8,
    gap: 4,
    width: "100%",
    maxWidth: 440,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 52,
    minWidth: 52,
    borderRadius: 26,
    paddingHorizontal: 14,
  },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.onAccent },
});
