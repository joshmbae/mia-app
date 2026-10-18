// ─── Kleine wiederverwendbare Stücke rund um Momente ─────────────────────────

import React from "react";
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, fonts, radius, tint } from "../utils/theme";

/** Foto eines Moments – oder, ohne Foto, ein großer Emoji-Sticker in seiner Farbe */
export function MomentPicture({
  photo,
  emoji,
  color,
  style,
  emojiSize = 34,
}: {
  photo?: string;
  emoji: string;
  color: string;
  style?: StyleProp<ViewStyle>;
  emojiSize?: number;
}) {
  if (photo) {
    return (
      <View style={[styles.frame, style]}>
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={[styles.frame, { backgroundColor: tint(color, 0.18), alignItems: "center", justifyContent: "center" }, style]}>
      <Text style={{ fontSize: emojiSize }}>{emoji}</Text>
    </View>
  );
}

/** Freundlicher Hinweis für leere Bereiche */
export function EmptyHint({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", borderRadius: radius.md, backgroundColor: colors.surfaceSoft },
  empty: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 20, gap: 6 },
  emptyEmoji: { fontSize: 44, marginBottom: 4 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, textAlign: "center" },
  emptyText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkSoft, textAlign: "center" },
});
