// ─── Bildschirm-Rahmen: Pfirsich-Grund mit weichen Blobs, Kopfzeile ──────────

import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, size, space } from "../../utils/theme";
import { IconButton } from "./Clay";
import { T } from "./T";

type BlobSet = "warm" | "cool" | "sun" | "none";

const BLOBS: Record<Exclude<BlobSet, "none">, [string, string]> = {
  warm: [colors.coralSoft, colors.skySoft],
  cool: [colors.skySoft, colors.sunSoft],
  sun: [colors.sunSoft, colors.mintSoft],
};

/** Zwei weiche, unregelmäßige Formen im Hintergrund — dezent, nie hinter Formularen */
export function Blobs({ variant = "warm" }: { variant?: BlobSet }) {
  if (variant === "none") return null;
  const [first, second] = BLOBS[variant];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          styles.blob,
          {
            width: 300,
            height: 260,
            backgroundColor: first,
            top: -120,
            right: -110,
            borderTopLeftRadius: 150,
            borderTopRightRadius: 120,
            borderBottomRightRadius: 160,
            borderBottomLeftRadius: 130,
          },
        ]}
      />
      <View
        style={[
          styles.blob,
          {
            width: 210,
            height: 190,
            backgroundColor: second,
            top: 360,
            left: -130,
            borderTopLeftRadius: 90,
            borderTopRightRadius: 110,
            borderBottomRightRadius: 95,
            borderBottomLeftRadius: 120,
          },
        ]}
      />
    </View>
  );
}

/** Platz unter dem Inhalt, damit nichts hinter der schwebenden Tab-Leiste verschwindet */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 14) + size.tabBar + space.xl;
}

export function Screen({
  children,
  scroll = true,
  blobs = "warm",
  contentStyle,
  bottomSpace = space.xxl,
  keyboard = false,
  scrollRef,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  blobs?: BlobSet;
  contentStyle?: StyleProp<ViewStyle>;
  bottomSpace?: number;
  keyboard?: boolean;
  scrollRef?: React.Ref<ScrollView>;
}) {
  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );
  return (
    <View style={styles.root}>
      <Blobs variant={blobs} />
      <SafeAreaView style={styles.flex} edges={["top"]}>
        {keyboard ? (
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            {body}
          </KeyboardAvoidingView>
        ) : (
          body
        )}
      </SafeAreaView>
    </View>
  );
}

/**
 * Kopfzeile. In Tabs ohne Zurück-Knopf, in Unterseiten mit Zurück (‹) und in
 * Modals mit Schließen (×). Rechts optional eine Aktion, z. B. "Speichern".
 */
export function Header({
  title,
  subtitle,
  right,
  back = true,
  onBack,
  backIcon = "chevron-back",
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  back?: boolean;
  onBack?: () => void;
  backIcon?: "chevron-back" | "close";
}) {
  return (
    <View style={styles.header}>
      {back && (
        <IconButton
          icon={backIcon}
          label={backIcon === "close" ? "Schließen" : "Zurück"}
          onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/start")))}
        />
      )}
      <View style={styles.headerText}>
        {title ? (
          <T variant="h1" accessibilityRole="header" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
            {title}
          </T>
        ) : null}
        {subtitle ? (
          <T variant="small" numberOfLines={1}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: "hidden" },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.gutter, paddingTop: space.xs },
  blob: { position: "absolute" },
  header: { flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.lg, minHeight: size.touch + 4 },
  headerText: { flex: 1 },
});
