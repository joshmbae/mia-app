import React, { useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Child } from "../../types";
import { useFamily } from "../../utils/family";
import { useChildData } from "../../utils/useChildData";
import { colors, fonts, radius, TAB_BAR_SPACE, tint, type } from "../../utils/theme";
import { formatDate } from "../../utils/dates";
import { buildChapters } from "../../utils/moments";
import { exportBook } from "../../utils/bookExport";
import { celebrate } from "../../utils/haptics";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayButton, ClayCard } from "../../components/ui/Clay";
import { ChildAvatar } from "../../components/ui/ChildAvatar";
import { EmptyHint } from "../../components/MomentBits";

export default function BookScreen() {
  const { active } = useFamily();
  if (!active) {
    return (
      <Screen bottomSpace={TAB_BAR_SPACE}>
        <Header title="Buch" back={false} />
        <Text style={type.body}>Lege zuerst ein Kind an.</Text>
      </Screen>
    );
  }
  return <Book child={active} />;
}

function Book({ child }: { child: Child }) {
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
    } catch {
      Alert.alert("Das hat nicht geklappt", "Das Buch konnte gerade nicht erstellt werden. Bitte versuch es noch einmal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen bottomSpace={TAB_BAR_SPACE} contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Header title="Das Buch" subtitle={`${child.name}s Geschichte zum Blättern`} back={false} />

      {/* Cover-Vorschau */}
      <View style={styles.coverWrap}>
        <View style={[styles.coverBack, { backgroundColor: tint(child.color, 0.35) }]} />
        <ClayCard style={styles.cover} glow={child.color} strength="strong">
          <ChildAvatar child={child} size={120} />
          <Text style={[type.label, { marginTop: 14 }]}>Unsere Momente mit</Text>
          <Text style={[type.hero, { textAlign: "center" }]}>{child.name}</Text>
          <Text style={type.small}>
            {child.kind === "baby" ? `seit dem ${formatDate(child.profile.birthDate)}` : `Termin: ${formatDate(child.profile.dueDate)}`}
          </Text>
        </ClayCard>
      </View>

      {moments.length === 0 ? (
        <ClayCard>
          <EmptyHint emoji="📖" title="Noch leere Seiten" text="Sobald ihr Momente festhaltet, wird daraus hier ein kleines Fotobuch zum Teilen, Drucken oder Verschenken." />
          <ClayButton label="Ersten Moment festhalten" icon="add" color={child.color} onPress={() => router.push(`/moment/neu?child=${child.id}`)} />
        </ClayCard>
      ) : (
        <View style={{ gap: 16 }}>
          <View style={styles.stats}>
            <Stat value={moments.length} label={moments.length === 1 ? "Moment" : "Momente"} bg={colors.coralSoft} />
            <Stat value={photoCount} label={photoCount === 1 ? "Foto" : "Fotos"} bg={colors.skySoft} />
            <Stat value={pages} label="Seiten" bg={colors.sunSoft} />
          </View>

          <ClayCard>
            <Text style={[type.h3, { marginBottom: 10 }]}>Kapitel</Text>
            {chapters.map((c) => (
              <View key={c.key} style={styles.chapterRow}>
                <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={type.bodyStrong}>{c.title}</Text>
                  <Text style={type.small}>{c.subtitle}</Text>
                </View>
                <Text style={styles.chapterCount}>{c.moments.length}</Text>
              </View>
            ))}
            {growth.length > 0 && (
              <View style={[styles.chapterRow, styles.toggleRow]}>
                <Text style={{ fontSize: 22 }}>📏</Text>
                <View style={{ flex: 1 }}>
                  <Text style={type.bodyStrong}>Messlatte</Text>
                  <Text style={type.small}>Alle Messungen auf einer Seite</Text>
                </View>
                <Switch
                  value={includeGrowth}
                  onValueChange={setIncludeGrowth}
                  trackColor={{ true: child.color, false: colors.line }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Messlatte ins Buch aufnehmen"
                />
              </View>
            )}
          </ClayCard>

          <ClayButton label="Buch als PDF erstellen" icon="book" color={child.color} loading={busy} onPress={handleExport} />
          <Text style={[type.small, { textAlign: "center" }]}>
            Format A5 · zum Teilen, Ausdrucken oder als Vorlage für ein gedrucktes Fotobuch.
          </Text>
        </View>
      )}
    </Screen>
  );
}

function Stat({ value, label, bg }: { value: number; label: string; bg: string }) {
  return (
    <ClayCard color={bg} strength="soft" style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={type.small}>{label}</Text>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  coverWrap: { alignItems: "center", marginBottom: 24, paddingTop: 6 },
  coverBack: {
    position: "absolute",
    top: 16,
    width: "78%",
    height: "92%",
    borderRadius: radius.xl,
    transform: [{ rotate: "4deg" }],
  },
  cover: { width: "78%", alignItems: "center", paddingVertical: 26, borderRadius: radius.xl, transform: [{ rotate: "-2deg" }] },
  stats: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statValue: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink },
  chapterRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  toggleRow: { borderTopWidth: 2, borderTopColor: colors.bgDeep, borderStyle: "dashed", marginTop: 6, paddingTop: 14 },
  chapterCount: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.inkSoft,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
    overflow: "hidden",
  },
});
