// ─── Kurze Einführung beim ersten Start ──────────────────────────────────────

import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFamily } from "../utils/family";
import { colors, clay, fonts, radius, tint, type } from "../utils/theme";
import { Screen } from "../components/ui/Screen";
import { ClayButton, Squish } from "../components/ui/Clay";
import { MiaMark } from "../components/ui/MiaMark";

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
          <View key={s.key} style={[styles.dot, i === index && { width: 26, backgroundColor: slide.color }]} />
        ))}
      </View>

      <View style={styles.center}>
        {slide.art ? (
          <View style={[styles.art, { backgroundColor: tint(slide.color, 0.18) }, clay(slide.color, "strong")]}>
            <Text style={{ fontSize: 76 }}>{slide.art}</Text>
          </View>
        ) : (
          <MiaMark size={150} />
        )}
        <Text style={[type.hero, styles.title]}>{slide.title}</Text>
        <Text style={[type.body, styles.text]}>{slide.text}</Text>

        {last && (
          <Squish
            onPress={() => setChecked((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            style={styles.check}
          >
            <View style={[styles.box, checked && { backgroundColor: slide.color, borderColor: slide.color }]}>
              {checked && <Ionicons name="checkmark" size={18} color={colors.onAccent} />}
            </View>
            <Text style={styles.checkText}>Verstanden</Text>
          </Squish>
        )}
      </View>

      <View style={{ gap: 6 }}>
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
  wrap: { paddingHorizontal: 24, paddingBottom: 28, justifyContent: "space-between", maxWidth: 520, width: "100%", alignSelf: "center" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, paddingTop: 16 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.line },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  art: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 84,
    borderTopRightRadius: 96,
    borderBottomRightRadius: 80,
    borderBottomLeftRadius: 98,
    backgroundColor: colors.surface,
  },
  title: { textAlign: "center", marginTop: 18 },
  text: { textAlign: "center", fontSize: 16.5, lineHeight: 25, maxWidth: 340 },
  check: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10, padding: 8 },
  box: {
    width: 30,
    height: 30,
    borderRadius: radius.sm - 4,
    borderWidth: 2.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.ink },
});
