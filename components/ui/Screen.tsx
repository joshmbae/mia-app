// ─── Bildschirm-Rahmen: Pfirsich-Grund mit weichen Blobs, Kopfzeile ──────────

import React from "react";
import { ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, fonts, space } from "../../utils/theme";
import { IconButton } from "./Clay";

type BlobSet = "warm" | "cool" | "none";

export function Blobs({ variant = "warm" }: { variant?: BlobSet }) {
  if (variant === "none") return null;
  const first = variant === "warm" ? colors.coralSoft : colors.skySoft;
  const second = variant === "warm" ? colors.skySoft : colors.sunSoft;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.blob, { width: 280, height: 280, backgroundColor: first, top: -110, right: -90 }]} />
      <View style={[styles.blob, { width: 200, height: 200, backgroundColor: second, top: 320, left: -120 }]} />
    </View>
  );
}

export function Screen({
  children,
  scroll = true,
  blobs = "warm",
  contentStyle,
  bottomSpace = 40,
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

/** Kopfzeile mit Zurück-Knopf, Titel und optionalem Element rechts */
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.headerSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: "hidden" },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: 8 },
  blob: { position: "absolute", borderRadius: 999 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18, minHeight: 48 },
  headerText: { flex: 1 },
  headerTitle: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 30, color: colors.ink },
  headerSub: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
});
