// ─── Hebamme finden ──────────────────────────────────────────────────────────

import React, { useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, size, soft, solid, space } from "../utils/theme";
import { Header, Screen } from "../components/ui/Screen";
import { ClayButton, ClayCard } from "../components/ui/Clay";
import { Field } from "../components/ui/Form";
import { T } from "../components/ui/T";

const TIPS: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; color: string }[] = [
  {
    icon: "calendar",
    title: "Am besten früh anfragen",
    text: "Viele Hebammen sind lange im Voraus ausgebucht – fragt am besten schon in den ersten Schwangerschaftswochen an.",
    color: colors.honey,
  },
  {
    icon: "people",
    title: "Was macht eine Hebamme?",
    text: "Hebammen betreuen dich während der Schwangerschaft, bei der Geburt und im Wochenbett (bis zu 12 Wochen nach der Geburt). Die Kosten trägt die Krankenkasse.",
    color: colors.mint,
  },
  {
    icon: "home",
    title: "Beleghebamme oder freie Hebamme?",
    text: "Eine Beleghebamme begleitet dich auch in der Klinik. Eine freie Hebamme betreut Schwangerschaft und Wochenbett — ideal auch für Hausgeburten oder Geburtshäuser.",
    color: colors.sky,
  },
  {
    icon: "chatbubbles",
    title: "Was beim Erstkontakt fragen?",
    text: "Erfahrung, freie Kapazität, Erreichbarkeit, ihre Haltung zur Geburt und ob sie Beleghebamme ist.",
    color: colors.lilac,
  },
  {
    icon: "heart",
    title: "Kein Platz mehr? Alternativen",
    text: "Hebammengruppen-Praxen haben oft mehr Kapazität. Auch Nachbarorte lohnen sich — und das Geburtshaus kann eine Alternative zur Klinik sein.",
    color: colors.coral,
  },
];

export default function MidwifeScreen() {
  const [plz, setPlz] = useState("");
  const valid = /^\d{5}$/.test(plz.trim());

  function openSearch() {
    if (!valid) {
      Alert.alert("Postleitzahl fehlt", "Bitte gebt eure fünfstellige Postleitzahl ein.");
      return;
    }
    Linking.openURL(`https://www.hebammenverband.de/hebammensuche/?plz=${plz.trim()}&umkreis=20`);
  }

  return (
    <Screen keyboard contentStyle={styles.content}>
      <Header title="Hebamme finden" subtitle="Eine der wichtigsten Begleiterinnen" />

      <ClayCard style={styles.search}>
        <View style={styles.searchIntro}>
          <T variant="h3" accessibilityRole="header">
            In eurer Nähe suchen
          </T>
          <T variant="small">Öffnet die offizielle Suche des Deutschen Hebammenverbands.</T>
        </View>
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
          style={styles.secondary}
        />
      </ClayCard>

      <T variant="h2" accessibilityRole="header" style={styles.sectionTitle}>
        Gut zu wissen
      </T>
      <View style={styles.tips}>
        {TIPS.map((t) => (
          <ClayCard key={t.title} color={soft(t.color)} style={styles.tip}>
            <View style={styles.tipIcon}>
              <Ionicons name={t.icon} size={size.icon.md} color={solid(t.color)} />
            </View>
            <View style={styles.tipText}>
              <T variant="h3">{t.title}</T>
              <T variant="body">{t.text}</T>
            </View>
          </ClayCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 560, width: "100%", alignSelf: "center" },
  search: { gap: space.xxs },
  searchIntro: { gap: space.xxs, marginBottom: space.sm },
  secondary: { marginTop: space.xs },
  sectionTitle: { marginTop: space.section, marginBottom: space.sm },
  tips: { gap: space.sm },
  tip: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  tipIcon: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: { flex: 1, gap: space.xxs },
});
