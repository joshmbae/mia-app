import React, { useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Child } from "../../types";
import { useFamily } from "../../utils/family";
import { useChildData } from "../../utils/useChildData";
import { colors, emoji, radius, size, solid, space, tint } from "../../utils/theme";
import { formatDate } from "../../utils/dates";
import { buildChapters } from "../../utils/moments";
import { exportBook } from "../../utils/bookExport";
import { celebrate } from "../../utils/haptics";
import { announce } from "../../utils/a11y";
import { Header, Screen, useTabBarSpace } from "../../components/ui/Screen";
import { ClayButton, ClayCard } from "../../components/ui/Clay";
import { T } from "../../components/ui/T";
import { ChildAvatar } from "../../components/ui/ChildAvatar";
import { EmptyHint } from "../../components/MomentBits";

const MAX_WIDTH = 560;

export default function BookScreen() {
  const { active } = useFamily();
  const bottomSpace = useTabBarSpace();
  if (!active) {
    return (
      <Screen bottomSpace={bottomSpace}>
        <Header title="Buch" back={false} />
        <T variant="body">Legt zuerst ein Kind an.</T>
      </Screen>
    );
  }
  return <Book child={active} bottomSpace={bottomSpace} />;
}

function Book({ child, bottomSpace }: { child: Child; bottomSpace: number }) {
  const { moments, growth } = useChildData(child.id);
  const [includeGrowth, setIncludeGrowth] = useState(true);
  const [busy, setBusy] = useState(false);
  const chapters = buildChapters(child, moments);
  const photoCount = moments.reduce((n, m) => n + Math.min(m.photos.length, 4), 0);
  const pages = 3 + chapters.length + moments.length + (includeGrowth && growth.length > 0 ? 1 : 0);

  async function handleExport() {
    if (moments.length === 0) return;
    setBusy(true);
    try {
      await exportBook(child, moments, growth, { includeGrowth });
      celebrate();
      announce("Buch erstellt");
    } catch {
      Alert.alert("Das hat nicht geklappt", "Das Buch konnte gerade nicht erstellt werden. Bitte versucht es noch einmal.");
    } finally {
      setBusy(false);
    }
  }

  const since = child.kind === "baby" ? `seit dem ${formatDate(child.profile.birthDate)}` : `Termin: ${formatDate(child.profile.dueDate)}`;

  return (
    <Screen bottomSpace={bottomSpace} contentStyle={styles.content}>
      <Header title="Das Buch" subtitle={`${child.name}s Geschichte zum Blättern`} back={false} />

      {/* Cover-Vorschau */}
      <View style={styles.coverWrap} accessible accessibilityRole="image" accessibilityLabel={`Buchcover: Unsere Momente mit ${child.name}, ${since}`}>
        <View style={[styles.coverBack, { backgroundColor: tint(child.color, 0.35) }]} />
        <ClayCard style={styles.cover} lift="float">
          <ChildAvatar child={child} size={96} />
          <T variant="label" style={styles.coverLabel}>
            Unsere Momente mit
          </T>
          <T variant="hero" align="center" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {child.name}
          </T>
          <T variant="small">{since}</T>
        </ClayCard>
      </View>

      {moments.length === 0 ? (
        <ClayCard>
          <EmptyHint emoji="📖" title="Noch leere Seiten" text="Sobald ihr Momente festhaltet, wird daraus hier ein kleines Fotobuch zum Teilen, Drucken oder Verschenken." />
          <ClayButton label="Ersten Moment festhalten" icon="add" color={child.color} onPress={() => router.push(`/moment/neu?child=${child.id}`)} />
        </ClayCard>
      ) : (
        <View style={styles.sections}>
          <View style={styles.group}>
            <View style={styles.stats}>
              <Stat value={moments.length} label={moments.length === 1 ? "Moment" : "Momente"} />
              <Stat value={photoCount} label={photoCount === 1 ? "Foto" : "Fotos"} />
              <Stat value={pages} label="Seiten" />
            </View>
            <ClayButton label="Buch als PDF erstellen" icon="book" color={child.color} loading={busy} onPress={handleExport} style={styles.cta} />
            <T variant="small" align="center">
              Format A5 · zum Teilen, Ausdrucken oder als Vorlage für ein gedrucktes Fotobuch.
            </T>
          </View>

          <ClayCard>
            <T variant="h3" accessibilityRole="header" style={styles.chapterTitle}>
              Kapitel
            </T>
            {chapters.map((c, i) => (
              <View key={c.key} style={[styles.chapterRow, i > 0 && styles.divider]}>
                <Text style={emoji(24)} accessibilityElementsHidden importantForAccessibility="no">
                  {c.emoji}
                </Text>
                <View style={styles.chapterText}>
                  <T variant="bodyStrong">{c.title}</T>
                  <T variant="small">{c.subtitle}</T>
                </View>
                <View style={styles.count} accessibilityLabel={`${c.moments.length} ${c.moments.length === 1 ? "Moment" : "Momente"}`}>
                  <T variant="chip" color={colors.inkSoft}>
                    {c.moments.length}
                  </T>
                </View>
              </View>
            ))}
            {growth.length > 0 && (
              <View style={[styles.chapterRow, styles.divider]}>
                <Text style={emoji(24)} accessibilityElementsHidden importantForAccessibility="no">
                  📏
                </Text>
                <View style={styles.chapterText}>
                  <T variant="bodyStrong">Messlatte</T>
                  <T variant="small">Alle Messungen auf einer Seite</T>
                </View>
                <Switch
                  value={includeGrowth}
                  onValueChange={setIncludeGrowth}
                  trackColor={{ true: solid(child.color), false: colors.line }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Messlatte ins Buch aufnehmen"
                />
              </View>
            )}
          </ClayCard>
        </View>
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <ClayCard style={styles.stat} accessibilityLabel={`${value} ${label}`}>
      <T variant="stat">{value}</T>
      <T variant="small">{label}</T>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: MAX_WIDTH, width: "100%", alignSelf: "center" },
  coverWrap: { alignItems: "center", marginBottom: space.lg, paddingTop: space.xxs },
  coverBack: {
    position: "absolute",
    top: space.sm,
    width: "70%",
    height: "92%",
    borderRadius: radius.xl,
    transform: [{ rotate: "4deg" }],
  },
  cover: { width: "70%", alignItems: "center", paddingVertical: space.lg, borderRadius: radius.xl, transform: [{ rotate: "-2deg" }] },
  coverLabel: { marginTop: space.sm },
  sections: { gap: space.section },
  group: { gap: space.sm },
  stats: { flexDirection: "row", gap: space.sm },
  stat: { flex: 1, alignItems: "center", paddingVertical: space.sm },
  cta: { marginTop: space.xs },
  chapterTitle: { marginBottom: space.xs },
  chapterRow: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: colors.line },
  chapterText: { flex: 1 },
  count: {
    minWidth: size.pill,
    height: size.pill,
    borderRadius: radius.pill,
    paddingHorizontal: space.xs,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
});
