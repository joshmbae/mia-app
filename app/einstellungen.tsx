// ─── Familie & Einstellungen ─────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../utils/supabase";
import { useFamily } from "../utils/family";
import { ageText, pregnancyWeek } from "../utils/dates";
import { colors, fonts, radius, type } from "../utils/theme";
import { Header, Screen } from "../components/ui/Screen";
import { ClayButton, ClayCard, Squish } from "../components/ui/Clay";
import { ChildAvatar } from "../components/ui/ChildAvatar";

const HELP: { emoji: string; title: string; text: string }[] = [
  {
    emoji: "✨",
    title: "Momente festhalten",
    text: "Tippe auf „Moment festhalten“, wähle eine Idee aus dem Katalog oder lege einen eigenen Moment an. Datum, Fotos und ein paar Zeilen — fertig.",
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
    <Screen contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Header title="Familie" subtitle="& Einstellungen" />

      <Text style={[type.h3, { marginBottom: 12 }]}>Eure Kinder</Text>
      {children.map((c) => (
        <ClayCard
          key={c.id}
          strength="soft"
          glow={c.color}
          style={styles.child}
          onPress={() => {
            setActive(c.id);
            router.push(c.kind === "baby" ? `/kind/bearbeiten?id=${c.id}` : `/schwangerschaft/bearbeiten?id=${c.id}`);
          }}
          accessibilityLabel={`${c.name} bearbeiten`}
        >
          <ChildAvatar child={c} size={54} ring={false} />
          <View style={{ flex: 1 }}>
            <Text style={type.h3}>{c.name}</Text>
            <Text style={type.small}>
              {c.kind === "baby" ? ageText(c.profile.birthDate) : `Schwangerschaft · SSW ${pregnancyWeek(c.profile.dueDate).week}`}
            </Text>
          </View>
          {active?.id === c.id && (
            <View style={[styles.activeTag, { backgroundColor: c.color }]}>
              <Text style={styles.activeText}>aktiv</Text>
            </View>
          )}
          <Ionicons name="create-outline" size={20} color={colors.muted} />
        </ClayCard>
      ))}
      <View style={styles.addRow}>
        <ClayButton label="Kind" icon="add" size="md" variant="soft" onPress={() => router.push("/kind/neu")} style={{ flex: 1 }} />
        <ClayButton label="Schwangerschaft" icon="add" size="md" variant="soft" color={colors.lilac} onPress={() => router.push("/schwangerschaft/neu")} style={{ flex: 1 }} />
      </View>

      <Text style={[type.h3, { marginTop: 28, marginBottom: 12 }]}>So funktioniert Mia</Text>
      <ClayCard style={{ paddingVertical: 6 }}>
        {HELP.map((h, i) => {
          const open = openHelp === h.title;
          return (
            <Squish
              key={h.title}
              haptic={false}
              onPress={() => setOpenHelp(open ? null : h.title)}
              accessibilityRole="button"
              accessibilityLabel={h.title}
              style={[styles.help, i > 0 && styles.helpBorder]}
            >
              <View style={styles.helpHead}>
                <Text style={{ fontSize: 20 }}>{h.emoji}</Text>
                <Text style={[type.bodyStrong, { flex: 1 }]}>{h.title}</Text>
                <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
              </View>
              {open && <Text style={[type.body, { marginTop: 8 }]}>{h.text}</Text>}
            </Squish>
          );
        })}
      </ClayCard>

      <Text style={[type.h3, { marginTop: 28, marginBottom: 12 }]}>Konto</Text>
      <ClayCard style={{ gap: 12 }}>
        <View style={styles.accountRow}>
          <Ionicons name="mail" size={20} color={colors.coral} />
          <Text style={[type.bodyStrong, { flex: 1 }]} numberOfLines={1}>
            {email ?? "…"}
          </Text>
        </View>
        <Text style={type.small}>Euer gemeinsamer Familien-Login. Fotos und Momente sind privat und nur für euch sichtbar.</Text>
        <ClayButton label="Abmelden" icon="log-out-outline" variant="ghost" color={colors.danger} size="md" onPress={logout} />
      </ClayCard>

      <Text style={[type.small, { textAlign: "center", marginTop: 24 }]}>
        Mia {Constants.expoConfig?.version ?? ""} · mit Liebe für Familien gemacht 💛{"\n"}Mia ersetzt keinen ärztlichen Rat.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  child: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12, paddingVertical: 12 },
  activeTag: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  activeText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.onAccent },
  addRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  help: { paddingVertical: 14 },
  helpBorder: { borderTopWidth: 2, borderTopColor: colors.bg },
  helpHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 10 },
});
