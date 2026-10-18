import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BabyProfile, Child, MomentEntry, PregnancyProfile } from "../../types";
import { useFamily } from "../../utils/family";
import { useChildData } from "../../utils/useChildData";
import { usePhotoUrls } from "../../utils/usePhotoUrls";
import { colors, fonts, radius, tint, TAB_BAR_SPACE, type } from "../../utils/theme";
import { ageText, daysUntil, formatDateShort, phaseReferenceDate, pregnancyWeek } from "../../utils/dates";
import { getCurrentPhase } from "../../utils/developmentPhases";
import { getPregnancyBlock } from "../../utils/pregnancyDevelopmentContent";
import { MILESTONES } from "../../utils/milestoneData";
import { latestValues, formatCm, formatWeight, momentColor, momentEmoji, momentTitle, onThisDay } from "../../utils/moments";
import { Screen } from "../../components/ui/Screen";
import { ClayButton, ClayCard, IconButton, Pill, Squish } from "../../components/ui/Clay";
import { ChildAvatar, ChildSwitcher } from "../../components/ui/ChildAvatar";
import { MiaMark } from "../../components/ui/MiaMark";
import { MomentPicture } from "../../components/MomentBits";

export default function StartScreen() {
  const { children, active, setActive, loaded, error, refresh } = useFamily();

  if (!loaded) return <Screen>{null}</Screen>;

  if (error && children.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={type.h2}>Hoppla</Text>
          <Text style={[type.body, { textAlign: "center" }]}>{error}</Text>
          <ClayButton label="Nochmal versuchen" icon="refresh" onPress={() => refresh()} />
        </View>
      </Screen>
    );
  }

  if (!active) return <Welcome />;

  return (
    <Screen bottomSpace={TAB_BAR_SPACE}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <ChildSwitcher
            items={children}
            activeId={active.id}
            onSelect={setActive}
            onAdd={() => router.push("/kind/neu")}
          />
        </View>
        <IconButton icon="settings-outline" label="Einstellungen" onPress={() => router.push("/einstellungen")} />
      </View>
      {active.kind === "baby" ? <BabyHome child={active} profile={active.profile} /> : <PregnancyHome child={active} profile={active.profile} />}
    </Screen>
  );
}

function yearsAgoLabel(iso: string): string {
  const years = new Date().getFullYear() - Number(iso.slice(0, 4));
  return years === 1 ? "Heute vor einem Jahr" : `Heute vor ${years} Jahren`;
}

// ─── Noch kein Kind ───────────────────────────────────────────────────────────

function Welcome() {
  return (
    <Screen bottomSpace={TAB_BAR_SPACE}>
      <View style={styles.welcome}>
        <MiaMark size={96} />
        <Text style={[type.hero, { textAlign: "center", marginTop: 18 }]}>Willkommen!</Text>
        <Text style={[type.body, { textAlign: "center", maxWidth: 320 }]}>
          Mia ist euer Tagebuch für die schönsten Momente — mit Fotos, ein paar Zeilen und einem Zeitstrahl fürs ganze Leben.
        </Text>
      </View>
      <ClayCard color={colors.coralSoft} glow={colors.coral} onPress={() => router.push("/kind/neu")} style={styles.welcomeCard} accessibilityLabel="Kind anlegen">
        <Text style={styles.welcomeEmoji}>👶</Text>
        <View style={{ flex: 1 }}>
          <Text style={type.h2}>Kind anlegen</Text>
          <Text style={type.small}>Name, Geburtstag und ein Foto</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={32} color={colors.coral} />
      </ClayCard>
      <ClayCard color={colors.lilacSoft} glow={colors.lilac} onPress={() => router.push("/schwangerschaft/neu")} style={styles.welcomeCard} accessibilityLabel="Schwangerschaft anlegen">
        <Text style={styles.welcomeEmoji}>🤰</Text>
        <View style={{ flex: 1 }}>
          <Text style={type.h2}>Wir erwarten ein Baby</Text>
          <Text style={type.small}>Schon vor der Geburt Momente sammeln</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={32} color={colors.lilac} />
      </ClayCard>
    </Screen>
  );
}

// ─── Kind ─────────────────────────────────────────────────────────────────────

function BabyHome({ child, profile }: { child: Child; profile: BabyProfile }) {
  const { moments, growth } = useChildData(child.id);
  const latest = moments[moments.length - 1];
  const memories = onThisDay(moments);
  const urls = usePhotoUrls([latest?.photos[0], ...memories.map((m) => m.photos[0])]);
  const phase = getCurrentPhase(phaseReferenceDate(profile));
  const values = latestValues(growth);
  const recorded = new Set(moments.map((m) => m.milestoneId).filter(Boolean));
  const ideas = MILESTONES.filter((m) => m.category === "erste_male" && !recorded.has(m.id)).slice(0, 6);

  return (
    <View style={styles.stack}>
      {/* Held */}
      <ClayCard style={styles.hero} glow={child.color}>
        <Squish onPress={() => router.push(`/kind/bearbeiten?id=${child.id}`)} accessibilityRole="button" accessibilityLabel={`${child.name} bearbeiten`}>
          <ChildAvatar child={child} size={150} />
          <View style={[styles.heroBadge, { backgroundColor: colors.sun }]}>
            <Ionicons name="star" size={20} color={colors.onAccent} />
          </View>
        </Squish>
        <Text style={[type.hero, { marginTop: 10 }]}>{child.name}</Text>
        <Text style={styles.heroAge}>{ageText(profile.birthDate)}</Text>
        {phase && (
          <Squish onPress={() => router.push("/phasen")} accessibilityRole="button" accessibilityLabel="Phase ansehen" style={{ marginTop: 8 }}>
            <Pill label={`${phase.emoji}  ${phase.title}`} />
          </Squish>
        )}
      </ClayCard>

      <ClayButton
        label="Moment festhalten"
        icon="add"
        color={child.color}
        onPress={() => router.push(`/moment/neu?child=${child.id}`)}
      />

      {/* Heute vor … */}
      {memories.length > 0 && (
        <ClayCard color={colors.sunSoft} glow={colors.sun} onPress={() => router.push(`/moment/${memories[0].id}?child=${child.id}`)} style={styles.memory}>
          <MomentPicture photo={urls[memories[0].photos[0]]} emoji={momentEmoji(memories[0])} color={momentColor(memories[0])} style={styles.memoryPic} />
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { color: colors.sunDeep }]}>{yearsAgoLabel(memories[0].happenedOn)}</Text>
            <Text style={type.h3} numberOfLines={2}>{momentTitle(memories[0])}</Text>
          </View>
        </ClayCard>
      )}

      {/* Zwei Kacheln */}
      <View style={styles.grid}>
        <ClayCard
          color={colors.skySoft}
          glow={colors.sky}
          style={styles.tile}
          onPress={() => (latest ? router.push(`/moment/${latest.id}?child=${child.id}`) : router.push(`/moment/neu?child=${child.id}`))}
          accessibilityLabel={latest ? `Zuletzt: ${momentTitle(latest)}` : "Ersten Moment festhalten"}
        >
          {latest ? (
            <>
              <MomentPicture photo={urls[latest.photos[0]]} emoji={momentEmoji(latest)} color={momentColor(latest)} style={styles.tilePic} />
              <Text style={[type.label, { color: colors.skyDeep, marginTop: 10 }]}>Zuletzt</Text>
              <Text style={styles.tileTitle} numberOfLines={2}>{momentTitle(latest)}</Text>
            </>
          ) : (
            <>
              <View style={[styles.tilePic, styles.tileEmpty]}>
                <Text style={{ fontSize: 34 }}>📸</Text>
              </View>
              <Text style={[type.label, { color: colors.skyDeep, marginTop: 10 }]}>Tagebuch</Text>
              <Text style={styles.tileTitle}>Der erste Moment wartet</Text>
            </>
          )}
        </ClayCard>

        <ClayCard color={colors.sunSoft} glow={colors.sun} style={styles.tile} onPress={() => router.push("/(tabs)/wachstum")} accessibilityLabel="Wachstum ansehen">
          <Text style={[type.label, { color: colors.sunDeep }]}>So groß schon</Text>
          <View style={styles.ruler}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.rulerTick, { width: i % 2 === 0 ? 12 : 7 }]} />
            ))}
          </View>
          {values.height || values.weight ? (
            <>
              {values.height && <Text style={styles.bigValue}>{formatCm(values.height.value)}</Text>}
              {values.weight && <Text style={styles.midValue}>{formatWeight(values.weight.value)}</Text>}
              <Text style={[type.small, { marginTop: 4 }]}>
                {formatDateShort((values.height ?? values.weight)!.on)}
              </Text>
            </>
          ) : (
            <Text style={[styles.tileTitle, { marginTop: 4 }]}>Erste Messung eintragen</Text>
          )}
        </ClayCard>
      </View>

      {/* Phase */}
      {phase && (
        <ClayCard color={colors.mintSoft} glow={colors.mint} onPress={() => router.push("/phasen")} accessibilityLabel="Phase ansehen">
          <View style={styles.rowCenter}>
            <Text style={{ fontSize: 30 }}>{phase.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[type.label, { color: colors.mintDeep }]}>Gerade bei {child.name}</Text>
              <Text style={type.h3}>{phase.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mintDeep} />
          </View>
          <Text style={[type.body, { marginTop: 10 }]} numberOfLines={3}>{phase.parentTip}</Text>
        </ClayCard>
      )}

      {/* Ideen */}
      {ideas.length > 0 && (
        <View>
          <Text style={[type.h3, { marginBottom: 4 }]}>Ideen für euer Tagebuch</Text>
          <Text style={[type.small, { marginBottom: 12 }]}>Ganz ohne Reihenfolge — einfach antippen, wenn es passiert ist.</Text>
          <View style={styles.ideas}>
            {ideas.map((m) => (
              <Squish
                key={m.id}
                onPress={() => router.push(`/moment/bearbeiten?child=${child.id}&milestone=${m.id}`)}
                accessibilityRole="button"
                accessibilityLabel={m.title}
                style={styles.idea}
              >
                <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
                <Text style={styles.ideaText}>{m.title}</Text>
              </Squish>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Schwangerschaft ──────────────────────────────────────────────────────────

function PregnancyHome({ child, profile }: { child: Child; profile: PregnancyProfile }) {
  const { moments } = useChildData(child.id);
  const latest: MomentEntry | undefined = moments[moments.length - 1];
  const urls = usePhotoUrls([latest?.photos[0]]);
  const { week, day } = pregnancyWeek(profile.dueDate);
  const left = daysUntil(profile.dueDate);
  const block = getPregnancyBlock(Math.max(4, week));

  return (
    <View style={styles.stack}>
      <ClayCard style={styles.hero} glow={child.color}>
        <Squish onPress={() => router.push(`/schwangerschaft/bearbeiten?id=${child.id}`)} accessibilityRole="button" accessibilityLabel={`${child.name} bearbeiten`}>
          <ChildAvatar child={child} size={150} />
        </Squish>
        <Text style={[type.hero, { marginTop: 10 }]}>{child.name}</Text>
        <Text style={styles.heroAge}>SSW {week}{day > 0 ? ` + ${day}` : ""}</Text>
        <Pill
          style={{ marginTop: 8 }}
          label={left > 0 ? `noch ${left} ${left === 1 ? "Tag" : "Tage"} bis zum Termin` : "Der Termin ist da"}
          color={colors.lilacDeep}
          background={colors.lilacSoft}
        />
      </ClayCard>

      <ClayButton label="Moment festhalten" icon="add" color={child.color} onPress={() => router.push(`/moment/neu?child=${child.id}`)} />

      {block && (
        <ClayCard color={colors.mintSoft} glow={colors.mint} onPress={() => router.push(`/schwangerschaft/woche?id=${child.id}`)} accessibilityLabel="Diese Woche ansehen">
          <Text style={[type.label, { color: colors.mintDeep }]}>{block.ageLabel} · so groß wie</Text>
          <Text style={[type.h1, { marginTop: 4 }]}>{block.babySize}</Text>
          <Text style={[type.body, { marginTop: 6 }]} numberOfLines={3}>{block.babyDev[0]}</Text>
          <View style={[styles.rowCenter, { marginTop: 10 }]}>
            <Text style={[type.small, { color: colors.mintDeep, flex: 1 }]}>Baby, Körper & To-dos dieser Woche</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mintDeep} />
          </View>
        </ClayCard>
      )}

      <View style={styles.grid}>
        <ClayCard
          color={colors.skySoft}
          glow={colors.sky}
          style={styles.tile}
          onPress={() => (latest ? router.push(`/moment/${latest.id}?child=${child.id}`) : router.push(`/moment/neu?child=${child.id}`))}
        >
          {latest ? (
            <>
              <MomentPicture photo={urls[latest.photos[0]]} emoji={momentEmoji(latest)} color={momentColor(latest)} style={styles.tilePic} />
              <Text style={[type.label, { color: colors.skyDeep, marginTop: 10 }]}>Zuletzt</Text>
              <Text style={styles.tileTitle} numberOfLines={2}>{momentTitle(latest)}</Text>
            </>
          ) : (
            <>
              <View style={[styles.tilePic, styles.tileEmpty]}>
                <Text style={{ fontSize: 34 }}>🩻</Text>
              </View>
              <Text style={[type.label, { color: colors.skyDeep, marginTop: 10 }]}>Idee</Text>
              <Text style={styles.tileTitle}>Erstes Ultraschallbild</Text>
            </>
          )}
        </ClayCard>
        <ClayCard color={colors.coralSoft} glow={colors.coral} style={styles.tile} onPress={() => router.push("/hebamme")} accessibilityLabel="Hebamme finden">
          <Text style={{ fontSize: 34 }}>🤝</Text>
          <Text style={[type.label, { color: colors.coralDeep, marginTop: 10 }]}>Gut zu wissen</Text>
          <Text style={styles.tileTitle}>Hebamme finden</Text>
        </ClayCard>
      </View>

      <ClayButton
        label="Unser Baby ist da!"
        icon="sparkles"
        variant="soft"
        color={colors.lilac}
        onPress={() => router.push(`/schwangerschaft/geburt?id=${child.id}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 18 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 120 },
  welcome: { alignItems: "center", gap: 10, paddingTop: 40, paddingBottom: 28 },
  welcomeCard: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16, padding: 20 },
  welcomeEmoji: { fontSize: 40 },
  hero: { alignItems: "center", borderRadius: radius.xl, paddingVertical: 24 },
  heroBadge: {
    position: "absolute",
    right: -4,
    bottom: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },
  heroAge: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.inkSoft, marginTop: 2 },
  memory: { flexDirection: "row", alignItems: "center", gap: 14 },
  memoryPic: { width: 64, height: 64 },
  grid: { flexDirection: "row", gap: 14 },
  tile: { flex: 1, minHeight: 200 },
  tilePic: { height: 92 },
  tileEmpty: { backgroundColor: tint(colors.sky, 0.15), alignItems: "center", justifyContent: "center" },
  tileTitle: { fontFamily: fonts.display, fontSize: 17, lineHeight: 21, color: colors.ink, marginTop: 2 },
  ruler: {
    width: 26,
    height: 64,
    borderRadius: 13,
    backgroundColor: colors.sun,
    alignItems: "center",
    justifyContent: "space-evenly",
    marginVertical: 10,
  },
  rulerTick: { height: 3, borderRadius: 2, backgroundColor: colors.onAccent },
  bigValue: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.ink, lineHeight: 34 },
  midValue: { fontFamily: fonts.display, fontSize: 19, color: colors.inkSoft },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 12 },
  ideas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  idea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.line,
  },
  ideaText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.ink },
});
