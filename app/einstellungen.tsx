// ─── Familie & Einstellungen ─────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../utils/supabase";
import { useFamily } from "../utils/family";
import { ageText, pregnancyWeek } from "../utils/dates";
import { colors, emoji, radius, size, soft, solid, space } from "../utils/theme";
import { Header, Screen } from "../components/ui/Screen";
import { ClayButton, ClayCard, Pill } from "../components/ui/Clay";
import { T } from "../components/ui/T";
import { ChildAvatar } from "../components/ui/ChildAvatar";

const HELP: { emoji: string; title: string; text: string }[] = [
  {
    emoji: "✨",
    title: "Momente festhalten",
    text: "Tippt auf „Moment festhalten“, wählt eine Idee aus dem Katalog oder legt einen eigenen Moment an. Datum, Fotos und ein paar Zeilen — fertig.",
  },
  {
    emoji: "🛤️",
    title: "Der Weg",
    text: "Alle Momente und Messungen erscheinen chronologisch auf einem Weg — von der Geburt (oder schon aus der Schwangerschaft) bis heute.",
  },
  {
    emoji: "📏",
    title: "Wachstum",
    text: "Größe, Gewicht und Kopfumfang eintragen, z. B. aus dem gelben U-Heft. Die Kurve zeigt nur den eigenen Verlauf eures Kindes, ohne Vergleich mit anderen.",
  },
  {
    emoji: "📖",
    title: "Das Buch",
    text: "Aus euren Momenten entsteht ein Fotobuch im A5-Format (PDF) — zum Teilen, Ausdrucken oder Verschenken.",
  },
  {
    emoji: "👨‍👩‍👧",
    title: "Gemeinsam nutzen",
    text: "Alle, die sich mit eurem Familien-Login anmelden, sehen dieselben Kinder, Momente und Fotos — auf jedem Gerät.",
  },
];

export default function SettingsScreen() {
  const { children, active, setActive } = useFamily();
  const [email, setEmail] = useState<string | null>(null);
  const [openHelp, setOpenHelp] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  function logout() {
    Alert.alert("Abmelden?", "Eure Daten bleiben gespeichert. Ihr könnt euch jederzeit wieder anmelden.", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Abmelden",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          await AsyncStorage.removeItem("mia_active_child").catch(() => {});
          router.dismissAll();
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <Screen contentStyle={styles.content}>
      <Header title="Familie" subtitle="& Einstellungen" />

      <T variant="h2" accessibilityRole="header" style={styles.sectionTitleFirst}>
        Eure Kinder
      </T>
      <View style={styles.group}>
        {children.map((c) => (
          <ClayCard
            key={c.id}
            style={styles.child}
            onPress={() => {
              setActive(c.id);
              router.push(c.kind === "baby" ? `/kind/bearbeiten?id=${c.id}` : `/schwangerschaft/bearbeiten?id=${c.id}`);
            }}
            accessibilityLabel={`${c.name} bearbeiten${active?.id === c.id ? ", aktiv" : ""}`}
          >
            <ChildAvatar child={c} size={52} ring={false} />
            <View style={styles.flex}>
              <T variant="h3" numberOfLines={1}>
                {c.name}
              </T>
              <T variant="small" numberOfLines={1}>
                {c.kind === "baby" ? ageText(c.profile.birthDate) : `Schwangerschaft · SSW ${pregnancyWeek(c.profile.dueDate).week}`}
              </T>
            </View>
            {active?.id === c.id && <Pill label="aktiv" color={c.color} background={soft(c.color)} />}
            <Ionicons name="create-outline" size={size.icon.md} color={colors.muted} />
          </ClayCard>
        ))}
      </View>
      <View style={styles.addColumn}>
        <ClayButton label="Kind hinzufügen" icon="add" size="md" variant="soft" onPress={() => router.push("/kind/neu")} />
        <ClayButton
          label="Schwangerschaft hinzufügen"
          icon="add"
          size="md"
          variant="soft"
          color={colors.lilac}
          onPress={() => router.push("/schwangerschaft/neu")}
        />
      </View>

      <T variant="h2" accessibilityRole="header" style={styles.sectionTitle}>
        So funktioniert Mia
      </T>
      <ClayCard style={styles.helpCard}>
        {HELP.map((h, i) => {
          const open = openHelp === h.title;
          return (
            <Pressable
              key={h.title}
              onPress={() => setOpenHelp(open ? null : h.title)}
              accessibilityRole="button"
              accessibilityLabel={h.title}
              accessibilityState={{ expanded: open }}
              style={({ pressed }) => [styles.help, i > 0 && styles.helpBorder, pressed && styles.helpPressed]}
            >
              <View style={styles.helpHead}>
                <Text style={emoji(20)} accessibilityElementsHidden importantForAccessibility="no">
                  {h.emoji}
                </Text>
                <T variant="bodyStrong" style={styles.flex}>
                  {h.title}
                </T>
                <Ionicons name={open ? "chevron-up" : "chevron-down"} size={size.icon.sm} color={colors.muted} />
              </View>
              {open && (
                <T variant="body" style={styles.helpText}>
                  {h.text}
                </T>
              )}
            </Pressable>
          );
        })}
      </ClayCard>

      <T variant="h2" accessibilityRole="header" style={styles.sectionTitle}>
        Konto
      </T>
      <ClayCard style={styles.account}>
        <View style={styles.accountRow}>
          <View style={styles.accountIcon}>
            <Ionicons name="mail" size={size.icon.md} color={solid(colors.coral)} />
          </View>
          <View style={styles.flex}>
            <T variant="label">Familien-Login</T>
            <T variant="bodyStrong" numberOfLines={1}>
              {email ?? "…"}
            </T>
          </View>
        </View>
        <T variant="small">Fotos und Momente sind privat und nur für euch sichtbar — auf jedem Gerät, mit dem ihr euch anmeldet.</T>
        <ClayButton label="Abmelden" icon="log-out-outline" variant="ghost" color={colors.danger} size="md" onPress={logout} />
      </ClayCard>

      <T variant="caption" color={colors.muted} align="center" style={styles.footer}>
        Mia {Constants.expoConfig?.version ?? ""} · mit Liebe für Familien gemacht 💛{"\n"}Mia ersetzt keinen ärztlichen Rat.
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 560, width: "100%", alignSelf: "center" },
  flex: { flex: 1 },
  sectionTitleFirst: { marginBottom: space.sm },
  sectionTitle: { marginTop: space.section, marginBottom: space.sm },
  group: { gap: space.sm },
  child: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm },
  addColumn: { gap: space.xs, marginTop: space.sm },
  helpCard: { paddingVertical: space.xxs },
  help: { paddingVertical: space.sm, minHeight: size.touch, justifyContent: "center" },
  helpBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  helpPressed: { opacity: 0.6 },
  helpHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  helpText: { marginTop: space.xs, paddingLeft: space.xl },
  account: { gap: space.sm },
  accountRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  accountIcon: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.sm,
    backgroundColor: colors.coralSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { marginTop: space.lg },
});
