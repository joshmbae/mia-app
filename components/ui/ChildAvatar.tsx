// ─── Kinderbild in weicher Blob-Form & Kinder-Umschalter ─────────────────────

import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Child } from "../../types";
import { colors, elevation, fonts, radius, size, soft, space } from "../../utils/theme";
import { usePhotoUrls } from "../../utils/usePhotoUrls";
import { Squish } from "./Clay";
import { T } from "./T";

/** Organische Blob-Ecken für eine quadratische Fläche */
function blobRadii(size: number, flip = false) {
  const r = (f: number) => Math.round(size * f);
  return flip
    ? { borderTopLeftRadius: r(0.5), borderTopRightRadius: r(0.44), borderBottomRightRadius: r(0.52), borderBottomLeftRadius: r(0.46) }
    : { borderTopLeftRadius: r(0.46), borderTopRightRadius: r(0.54), borderBottomRightRadius: r(0.45), borderBottomLeftRadius: r(0.55) };
}

export function ChildAvatar({
  child,
  size = 150,
  ring = true,
}: {
  child: Child;
  size?: number;
  ring?: boolean;
}) {
  const photoRef = child.kind === "baby" ? child.profile.photoUri : undefined;
  const urls = usePhotoUrls([photoRef]);
  const photo = photoRef ? urls[photoRef] : undefined;
  const inner = ring ? size - Math.round(size * 0.13) : size;

  const content = photo ? (
    <Image source={{ uri: photo }} style={[{ width: inner, height: inner }, blobRadii(inner, true)]} />
  ) : (
    <View style={[{ width: inner, height: inner, backgroundColor: child.color, alignItems: "center", justifyContent: "center" }, blobRadii(inner, true)]}>
      {child.kind === "pregnancy" ? (
        <Text style={{ fontSize: inner * 0.42 }}>🤰</Text>
      ) : (
        <Text style={{ fontFamily: fonts.displayBold, fontSize: inner * 0.42, color: colors.onAccent }}>
          {child.name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );

  if (!ring) return content;
  return (
    <View style={[{ width: size, height: size, backgroundColor: soft(child.color), alignItems: "center", justifyContent: "center" }, blobRadii(size)]}>
      {content}
    </View>
  );
}

/** Reihe zum Umschalten zwischen Kindern, plus Knopf zum Hinzufügen */
export function ChildSwitcher({
  items,
  activeId,
  onSelect,
  onAdd,
}: {
  items: Child[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll}>
      {items.map((c) => {
        const active = c.id === activeId;
        return (
          <Squish
            key={c.id}
            onPress={() => onSelect(c.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${c.name} anzeigen`}
            style={[styles.chip, active ? [styles.chipActive, elevation.raised] : styles.chipIdle]}
          >
            <ChildAvatar child={c} size={32} ring={false} />
            <T variant="chip" color={active ? colors.ink : colors.inkSoft} numberOfLines={1} style={styles.chipText}>
              {c.name}
            </T>
          </Squish>
        );
      })}
      <Squish onPress={onAdd} accessibilityRole="button" accessibilityLabel="Kind hinzufügen" style={styles.add}>
        <Ionicons name="add" size={size.icon.md} color={colors.muted} />
      </Squish>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -space.gutter, flexGrow: 0 },
  row: { paddingHorizontal: space.gutter, gap: space.xs, alignItems: "center", paddingVertical: space.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    borderRadius: radius.pill,
    paddingLeft: space.xxs + 2,
    paddingRight: space.md,
    height: size.touch + 2,
  },
  chipActive: { backgroundColor: colors.surface },
  chipIdle: { backgroundColor: "rgba(255,255,255,0.55)" },
  chipText: { maxWidth: 140 },
  add: {
    width: size.touch + 2,
    height: size.touch + 2,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.peach,
    alignItems: "center",
    justifyContent: "center",
  },
});
