// ─── Kurze Einführung beim ersten Start ──────────────────────────────────────

import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFamily } from "../utils/family";
import { colors, elevation, emoji, radius, size, soft, solid, space } from "../utils/theme";
import { Screen } from "../components/ui/Screen";
import { ClayButton, Squish } from "../components/ui/Clay";
import { MiaMark } from "../components/ui/MiaMark";
import { T } from "../components/ui/T";

const SLIDES = [
  {
    key: "hallo",
    art: null as string | null,
    color: colors.coral,
    title: "Hallo, ich bin Mia",
    text: "Euer Tagebuch für die erste Zeit — und für alles, was danach kommt.",
  },
  {
    key: "momente",
    art: "📸",
    color: colors.sky,
    title: "Momente sammeln",
    text: "Das erste Lachen, der erste Brei, ein ganz normaler schöner Dienstag: mit Foto und ein paar Zeilen festgehalten.",
  },
  {
    key: "weg",
    art: "🛤️",
    color: colors.mint,
    title: "Ein Weg fürs ganze Leben",
    text: "Alle Momente und Messungen auf einem Zeitstrahl — und am Ende vielleicht ein Buch zum Blättern.",
  },
  {
    key: "tempo",
    art: "💛",
    color: colors.honey,
    title: "Jedes Kind hat sein Tempo",
    text: "Bei Mia gibt es kein „zu früh“ und kein „zu spät“. Mia ersetzt keine Hebamme und keinen Kinderarzt — im Notfall immer 112.",
  },
];

export default function OnboardingScreen() {
  const { refresh } = useFamily();
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  async function finish() {
    await AsyncStorage.setItem("mia_onboarded", "true").catch(() => {});
    await refresh();
    router.replace("/(tabs)/start");
  }

  return (
    <Screen scroll={false} contentStyle={styles.wrap}>
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === index && { width: space.lg, backgroundColor: solid(slide.color) }]} />
        ))}
      </View>

      <View style={styles.center}>
        {slide.art ? (
          <View style={[styles.art, { backgroundColor: soft(slide.color) }, elevation.float]}>
            <Text style={emoji(96)} accessibilityElementsHidden importantForAccessibility="no">
              {slide.art}
            </Text>
          </View>
        ) : (
          <MiaMark size={150} />
        )}
        <T variant="title" align="center" accessibilityRole="header" style={styles.title}>
          {slide.title}
        </T>
        <T variant="bodyLong" align="center" style={styles.text}>
          {slide.text}
        </T>

        {last && (
          <Squish
            onPress={() => setChecked((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel="Verstanden: Mia ersetzt keine Hebamme und keinen Kinderarzt"
            style={styles.check}
          >
            <View style={[styles.box, checked && { backgroundColor: solid(slide.color), borderColor: solid(slide.color) }]}>
              {checked && <Ionicons name="checkmark" size={size.icon.sm} color={colors.onAccent} />}
            </View>
            <T variant="bodyStrong">Verstanden</T>
          </Squish>
        )}
      </View>

      <View style={styles.actions}>
        <ClayButton
          label={last ? "Los geht's" : "Weiter"}
          icon={last ? "heart" : "arrow-forward"}
          color={slide.color}
          disabled={last && !checked}
          onPress={() => (last ? finish() : setIndex((i) => i + 1))}
        />
        {index > 0 && <ClayButton label="Zurück" variant="ghost" color={colors.inkSoft} size="md" onPress={() => setIndex((i) => i - 1)} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.lg,
    justifyContent: "space-between",
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: space.xs, paddingTop: space.md },
  dot: { width: space.xs, height: space.xs, borderRadius: radius.pill, backgroundColor: colors.line },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.sm },
  art: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 84,
    borderTopRightRadius: 96,
    borderBottomRightRadius: 80,
    borderBottomLeftRadius: 98,
  },
  title: { marginTop: space.md },
  text: { maxWidth: 340 },
  check: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.xs, minHeight: size.touch, paddingHorizontal: space.xs },
  box: {
    width: 28,
    height: 28,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.faint,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { gap: space.xxs },
});
