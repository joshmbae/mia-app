// ─── Kleine wiederverwendbare Stücke rund um Momente ─────────────────────────

import React from "react";
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, emoji as emojiSize, radius, soft, space } from "../utils/theme";
import { T } from "./ui/T";

/** Foto eines Moments – oder, ohne Foto, ein großer Emoji-Sticker auf seiner hellen Farbe */
export function MomentPicture({
  photo,
  emoji,
  color,
  style,
  emojiSize: size = 32,
  label,
}: {
  photo?: string;
  emoji: string;
  color: string;
  style?: StyleProp<ViewStyle>;
  emojiSize?: 16 | 20 | 24 | 32 | 44 | 64 | 96;
  label?: string;
}) {
  if (photo) {
    return (
      <View style={[styles.frame, style]}>
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={label} />
      </View>
    );
  }
  return (
    <View style={[styles.frame, { backgroundColor: soft(color), alignItems: "center", justifyContent: "center" }, style]}>
      <Text style={emojiSize(size)} accessibilityElementsHidden importantForAccessibility="no">
        {emoji}
      </Text>
    </View>
  );
}

/** Freundlicher Hinweis für leere Bereiche */
export function EmptyHint({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={[emojiSize(44), { marginBottom: space.xxs }]}>{emoji}</Text>
      <T variant="h2" align="center">
        {title}
      </T>
      <T variant="body" align="center">
        {text}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", borderRadius: radius.md, backgroundColor: colors.surfaceSoft },
  empty: { alignItems: "center", paddingVertical: space.lg, paddingHorizontal: space.md, gap: space.xs },
});
