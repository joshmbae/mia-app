// ─── Hebamme finden ──────────────────────────────────────────────────────────

import React, { useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, type } from "../utils/theme";
import { Header, Screen } from "../components/ui/Screen";
import { ClayButton, ClayCard } from "../components/ui/Clay";
import { Field } from "../components/ui/Form";

const TIPS: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; bg: string; fg: string }[] = [
  {
    icon: "calendar",
    title: "Früh suchen — ab SSW 8",
    text: "Hebammen sind oft Monate im Voraus ausgebucht. Starte die Suche so früh wie möglich, idealerweise ab der 8.–10. Schwangerschaftswoche.",
    bg: colors.sunSoft,
    fg: colors.sunDeep,
  },
  {
    icon: "people",
    title: "Was macht eine Hebamme?",
    text: "Hebammen betreuen dich während der Schwangerschaft, bei der Geburt und im Wochenbett (bis zu 12 Wochen nach der Geburt). Die Kosten trägt die Krankenkasse.",
    bg: colors.mintSoft,
    fg: colors.mintDeep,
  },
  {
    icon: "home",
    title: "Beleghebamme oder freie Hebamme?",
    text: "Eine Beleghebamme begleitet dich auch in der Klinik. Eine freie Hebamme betreut Schwangerschaft und Wochenbett — ideal auch für Hausgeburten oder Geburtshäuser.",
    bg: colors.skySoft,
    fg: colors.skyDeep,
  },
  {
    icon: "chatbubbles",
    title: "Was beim Erstkontakt fragen?",
    text: "Erfahrung, freie Kapazität, Erreichbarkeit, ihre Haltung zur Geburt und ob sie Beleghebamme ist.",
    bg: colors.lilacSoft,
    fg: colors.lilacDeep,
  },
  {
    icon: "heart",
    title: "Kein Platz mehr? Alternativen",
    text: "Hebammengruppen-Praxen haben oft mehr Kapazität. Auch Nachbarorte lohnen sich — und das Geburtshaus kann eine Alternative zur Klinik sein.",
    bg: colors.coralSoft,
    fg: colors.coralDeep,
  },
];

export default function MidwifeScreen() {
  const [plz, setPlz] = useState("");
  const valid = /^\d{5}$/.test(plz.trim());

  function openSearch() {
    if (!valid) {
      Alert.alert("Postleitzahl fehlt", "Bitte gib deine fünfstellige Postleitzahl ein.");
      return;
    }
    Linking.openURL(`https://www.hebammenverband.de/hebammensuche/?plz=${plz.trim()}&umkreis=20`);
  }

  return (
    <Screen keyboard contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Header title="Hebamme finden" subtitle="Eine der wichtigsten Begleiterinnen" />

      <ClayCard style={{ marginBottom: 22 }}>
        <Text style={[type.h3, { marginBottom: 4 }]}>In deiner Nähe suchen</Text>
        <Text style={[type.small, { marginBottom: 14 }]}>Öffnet die offizielle Suche des Deutschen Hebammenverbands.</Text>
        <Field
          label="Postleitzahl"
          value={plz}
          onChangeText={(t) => setPlz(t.replace(/\D/g, "").slice(0, 5))}
          placeholder="z. B. 10115"
          keyboardType="number-pad"
          returnKeyType="search"
          onSubmitEditing={openSearch}
        />
        <ClayButton label="Hebammen suchen" icon="search" onPress={openSearch} disabled={!valid} />
        <ClayButton
          label="Geburtshaus suchen"
          icon="home"
          variant="ghost"
          color={colors.lilac}
          size="md"
          onPress={() => Linking.openURL("https://www.netzwerk-der-geburtshaeuser.de/geburtshaus-suche/")}
          style={{ marginTop: 6 }}
        />
      </ClayCard>

      <Text style={[type.h3, { marginBottom: 12 }]}>Gut zu wissen</Text>
      {TIPS.map((t) => (
        <ClayCard key={t.title} color={t.bg} glow={t.fg} strength="soft" style={styles.tip}>
          <View style={[styles.tipIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name={t.icon} size={22} color={t.fg} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>{t.title}</Text>
            <Text style={[type.body, { fontSize: 14.5 }]}>{t.text}</Text>
          </View>
        </ClayCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tip: { flexDirection: "row", gap: 14, marginBottom: 12 },
  tipIcon: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  tipTitle: { fontFamily: fonts.display, fontSize: 16.5, color: colors.ink, marginBottom: 4 },
});
