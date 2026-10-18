import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BabyProfile, Child, MomentEntry, PregnancyProfile } from "../../types";
import { useFamily } from "../../utils/family";
import { useChildData } from "../../utils/useChildData";
import { usePhotoUrls } from "../../utils/usePhotoUrls";
import { colors, emoji, radius, size, solid, space } from "../../utils/theme";
import { ageText, daysUntil, formatDateShort, phaseReferenceDate, pregnancyWeek } from "../../utils/dates";
import { getCurrentPhase } from "../../utils/developmentPhases";
import { getPregnancyBlock } from "../../utils/pregnancyDevelopmentContent";
import { MILESTONES } from "../../utils/milestoneData";
import { latestValues, formatCm, formatWeight, momentColor, momentEmoji, momentTitle, onThisDay } from "../../utils/moments";
import { Screen, useTabBarSpace } from "../../components/ui/Screen";
import { ClayButton, ClayCard, IconButton, Squish } from "../../components/ui/Clay";
import { ChildAvatar, ChildSwitcher } from "../../components/ui/ChildAvatar";
import { MiaMark } from "../../components/ui/MiaMark";
import { T } from "../../components/ui/T";
import { MomentPicture } from "../../components/MomentBits";

export default function StartScreen() {
  const { children, active, setActive, loaded, error, refresh } = useFamily();
  const bottomSpace = useTabBarSpace();

  if (!loaded) return <Screen>{null}</Screen>;

  if (error && children.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <T variant="h2" align="center">
            Hoppla
          </T>
          <T variant="body" align="center">
            {error}
          </T>
          <ClayButton label="Nochmal versuchen" icon="refresh" onPress={() => refresh()} />
        </View>
      </Screen>
    );
  }

  if (!active) return <Welcome bottomSpace={bottomSpace} />;

  return (
    <Screen bottomSpace={bottomSpace}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <ChildSwitcher items={children} activeId={active.id} onSelect={setActive} onAdd={() => router.push("/kind/neu")} />
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

function Welcome({ bottomSpace }: { bottomSpace: number }) {
  return (
    <Screen bottomSpace={bottomSpace}>
      <View style={styles.welcome}>
        <MiaMark size={96} />
        <T variant="hero" align="center" style={{ marginTop: space.md }}>
          Willkommen!
        </T>
        <T variant="body" align="center" style={{ maxWidth: 320 }}>
          Mia ist euer Tagebuch für die schönsten Momente — mit Fotos, ein paar Zeilen und einem Zeitstrahl fürs ganze Leben.
        </T>
      </View>
      <View style={styles.group}>
        <WelcomeCard
          color={colors.coral}
          emojiChar="👶"
          title="Kind anlegen"
          text="Name, Geburtstag und ein Foto"
          onPress={() => router.push("/kind/neu")}
        />
        <WelcomeCard
          color={colors.lilac}
          emojiChar="🤰"
          title="Wir erwarten ein Baby"
          text="Schon vor der Geburt Momente sammeln"
          onPress={() => router.push("/schwangerschaft/neu")}
        />
      </View>
    </Screen>
  );
}

function WelcomeCard({
  color,
  emojiChar,
  title,
  text,
  onPress,
}: {
  color: string;
  emojiChar: string;
  title: string;
  text: string;
  onPress: () => void;
}) {
  const bg = color === colors.coral ? colors.coralSoft : colors.lilacSoft;
  return (
    <ClayCard color={bg} onPress={onPress} style={styles.welcomeCard} accessibilityLabel={title}>
      <Text style={emoji(44)} accessibilityElementsHidden importantForAccessibility="no">
        {emojiChar}
      </Text>
      <View style={{ flex: 1 }}>
        <T variant="h2">{title}</T>
        <T variant="small">{text}</T>
      </View>
      <Ionicons name="arrow-forward-circle" size={size.icon.lg} color={solid(color)} />
    </ClayCard>
  );
}

// ─── Gemeinsame Bausteine ─────────────────────────────────────────────────────

/** Kompakter Kopf: Avatar links, Name und Alter rechts — die ganze Karte öffnet "Bearbeiten" */
function Hero({ child, line1, line2 }: { child: Child; line1: string; line2?: string }) {
  const editPath = child.kind === "baby" ? `/kind/bearbeiten?id=${child.id}` : `/schwangerschaft/bearbeiten?id=${child.id}`;
  return (
    <ClayCard
      lift="float"
      style={styles.hero}
      onPress={() => router.push(editPath)}
      accessibilityLabel={`${child.name}, ${line1}${line2 ? `, ${line2}` : ""}. Profil bearbeiten`}
    >
      <ChildAvatar child={child} size={88} />
      <View style={{ flex: 1 }}>
        <T variant="hero" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {child.name}
        </T>
        <T variant="body">{line1}</T>
        {line2 ? <T variant="small" color={colors.muted}>{line2}</T> : null}
      </View>
      <Ionicons name="chevron-forward" size={size.icon.sm} color={colors.muted} />
    </ClayCard>
  );
}

function SectionHead({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <T variant="h3" accessibilityRole="header" style={{ flex: 1 }}>
        {title}
      </T>
      {link && onLink ? (
        <Squish onPress={onLink} accessibilityRole="link" accessibilityLabel={link} hitSlop={8} style={styles.linkBtn}>
          <T variant="chip" color={colors.inkSoft}>
            {link}
          </T>
          <Ionicons name="chevron-forward" size={size.icon.sm} color={colors.inkSoft} />
        </Squish>
      ) : null}
    </View>
  );
}

/** Die drei zuletzt festgehaltenen Momente als kleine Vorschaubilder */
function RecentStrip({
  child,
  moments,
  emptyEmoji,
  emptyTitle,
  emptyText,
}: {
  child: Child;
  moments: MomentEntry[];
  emptyEmoji: string;
  emptyTitle: string;
  emptyText: string;
}) {
  const recent = moments.slice(-3).reverse();
  const urls = usePhotoUrls(recent.map((m) => m.photos[0]));

  if (recent.length === 0) {
    return (
      <ClayCard onPress={() => router.push(`/moment/neu?child=${child.id}`)} style={styles.emptyCard} accessibilityLabel={emptyTitle}>
        <Text style={emoji(44)} accessibilityElementsHidden importantForAccessibility="no">
          {emptyEmoji}
        </Text>
        <View style={{ flex: 1 }}>
          <T variant="h3">{emptyTitle}</T>
          <T variant="small">{emptyText}</T>
        </View>
        <Ionicons name="add-circle" size={size.icon.lg} color={solid(child.color)} />
      </ClayCard>
    );
  }

  const slots: (MomentEntry | null)[] = [...recent, null, null].slice(0, 3);
  return (
    <View>
      <SectionHead title="Zuletzt festgehalten" link="Alle ansehen" onLink={() => router.push("/(tabs)/zeitstrahl")} />
      <View style={styles.strip}>
        {slots.map((m, i) =>
          m ? (
            <Squish
              key={m.id}
              style={styles.thumb}
              onPress={() => router.push(`/moment/${m.id}?child=${child.id}`)}
              accessibilityRole="button"
              accessibilityLabel={momentTitle(m)}
            >
              <MomentPicture
                photo={urls[m.photos[0]]}
                emoji={momentEmoji(m)}
                color={momentColor(m)}
                style={styles.thumbPic}
                emojiSize={32}
                label={momentTitle(m)}
              />
              <T variant="caption" numberOfLines={1} style={{ marginTop: space.xs }}>
                {momentTitle(m)}
              </T>
            </Squish>
          ) : (
            <View key={`empty-${i}`} style={styles.thumb} />
          ),
        )}
      </View>
    </View>
  );
}

// ─── Kind ─────────────────────────────────────────────────────────────────────

function BabyHome({ child, profile }: { child: Child; profile: BabyProfile }) {
  const { moments, growth } = useChildData(child.id);
  const memories = onThisDay(moments);
  const urls = usePhotoUrls(memories.map((m) => m.photos[0]));
  const phase = getCurrentPhase(phaseReferenceDate(profile));
  const values = latestValues(growth);
  const recorded = new Set(moments.map((m) => m.milestoneId).filter(Boolean));
  const ideas = MILESTONES.filter((m) => m.category === "erste_male" && !recorded.has(m.id)).slice(0, 3);
  const memory = memories[0];

  return (
    <View style={styles.stack}>
      <View style={styles.group}>
        <Hero child={child} line1={ageText(profile.birthDate)} />
        <ClayButton label="Moment festhalten" icon="add" color={child.color} onPress={() => router.push(`/moment/neu?child=${child.id}`)} />
      </View>

      {/* Heute vor … */}
      {memory && (
        <ClayCard
          color={colors.sunSoft}
          onPress={() => router.push(`/moment/${memory.id}?child=${child.id}`)}
          style={styles.memory}
          accessibilityLabel={`${yearsAgoLabel(memory.happenedOn)}: ${momentTitle(memory)}`}
        >
          <MomentPicture photo={urls[memory.photos[0]]} emoji={momentEmoji(memory)} color={momentColor(memory)} style={styles.memoryPic} emojiSize={32} />
          <View style={{ flex: 1 }}>
            <T variant="label" color={colors.sunDeep}>
              {yearsAgoLabel(memory.happenedOn)}
            </T>
            <T variant="h3" numberOfLines={2}>
              {momentTitle(memory)}
            </T>
          </View>
          <Ionicons name="chevron-forward" size={size.icon.sm} color={colors.sunDeep} />
        </ClayCard>
      )}

      <RecentStrip
        child={child}
        moments={moments}
        emptyEmoji="📸"
        emptyTitle="Der erste Moment wartet"
        emptyText="Ein Foto, ein paar Zeilen — schon beginnt euer Tagebuch."
      />

      {/* Wachstum + Phase */}
      <View style={styles.tiles}>
        <ClayCard style={styles.tile} onPress={() => router.push("/(tabs)/wachstum")} accessibilityLabel="Wachstum ansehen">
          <T variant="label" color={colors.skyDeep}>
            So groß schon
          </T>
          {values.height || values.weight ? (
            <View style={styles.tileBody}>
              {values.height ? (
                <T variant="stat" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                  {formatCm(values.height.value)}
                </T>
              ) : null}
              {values.weight ? (
                <T variant={values.height ? "bodyStrong" : "stat"} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                  {formatWeight(values.weight.value)}
                </T>
              ) : null}
              <T variant="caption" color={colors.muted} style={{ marginTop: space.xxs }}>
                {formatDateShort((values.height ?? values.weight)!.on)}
              </T>
            </View>
          ) : (
            <View style={styles.tileBody}>
              <T variant="h3">Erste Messung eintragen</T>
            </View>
          )}
        </ClayCard>

        {phase ? (
          <ClayCard color={colors.mintSoft} style={styles.tile} onPress={() => router.push("/phasen")} accessibilityLabel={`Phase ${phase.title} ansehen`}>
            <T variant="label" color={colors.mintDeep}>
              Gerade dran
            </T>
            <View style={styles.tileBody}>
              <Text style={emoji(32)} accessibilityElementsHidden importantForAccessibility="no">
                {phase.emoji}
              </Text>
              <T variant="h3" numberOfLines={2}>
                {phase.title}
              </T>
              <View style={[styles.rowCenter, { marginTop: space.xxs }]}>
                <T variant="caption" color={colors.mintDeep}>
                  Mehr erfahren
                </T>
                <Ionicons name="chevron-forward" size={size.icon.sm} color={colors.mintDeep} />
              </View>
            </View>
          </ClayCard>
        ) : null}
      </View>

      {/* Ideen */}
      {ideas.length > 0 && (
        <View>
          <T variant="h3" accessibilityRole="header">
            Ideen für euer Tagebuch
          </T>
          <T variant="small" style={{ marginTop: space.xxs, marginBottom: space.sm }}>
            Ganz ohne Reihenfolge — einfach antippen, wenn es passiert ist.
          </T>
          <View style={styles.ideas}>
            {ideas.map((m) => (
              <Squish
                key={m.id}
                onPress={() => router.push(`/moment/bearbeiten?child=${child.id}&milestone=${m.id}`)}
                accessibilityRole="button"
                accessibilityLabel={m.title}
                style={styles.idea}
              >
                <Text style={emoji(16)} accessibilityElementsHidden importantForAccessibility="no">
                  {m.emoji}
                </Text>
                <T variant="chip" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {m.title}
                </T>
              </Squish>
            ))}
            <Squish
              onPress={() => router.push(`/moment/neu?child=${child.id}`)}
              accessibilityRole="button"
              accessibilityLabel="Alle Ideen ansehen"
              style={[styles.idea, styles.ideaMore]}
            >
              <T variant="chip" color={colors.inkSoft}>
                Alle Ideen
              </T>
              <Ionicons name="chevron-forward" size={size.icon.sm} color={colors.inkSoft} />
            </Squish>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Schwangerschaft ──────────────────────────────────────────────────────────

function PregnancyHome({ child, profile }: { child: Child; profile: PregnancyProfile }) {
  const { moments } = useChildData(child.id);
  const { week, day } = pregnancyWeek(profile.dueDate);
  const left = daysUntil(profile.dueDate);
  const block = getPregnancyBlock(Math.max(4, week));

  return (
    <View style={styles.stack}>
      <View style={styles.group}>
        <Hero
          child={child}
          line1={`SSW ${week}${day > 0 ? ` + ${day}` : ""}`}
          line2={left > 0 ? `noch ${left} ${left === 1 ? "Tag" : "Tage"} bis zum Termin` : "Der Termin ist da"}
        />
        <ClayButton label="Moment festhalten" icon="add" color={child.color} onPress={() => router.push(`/moment/neu?child=${child.id}`)} />
      </View>

      {block && (
        <ClayCard color={colors.mintSoft} onPress={() => router.push(`/schwangerschaft/woche?id=${child.id}`)} accessibilityLabel="Diese Woche ansehen">
          <T variant="label" color={colors.mintDeep}>
            {block.ageLabel} · so groß wie
          </T>
          <T variant="h1" style={{ marginTop: space.xxs }}>
            {block.babySize}
          </T>
          <T variant="body" numberOfLines={3} style={{ marginTop: space.xs }}>
            {block.babyDev[0]}
          </T>
          <View style={[styles.rowCenter, { marginTop: space.sm }]}>
            <T variant="small" color={colors.mintDeep} style={{ flex: 1 }}>
              Baby, Körper & To-dos dieser Woche
            </T>
            <Ionicons name="chevron-forward" size={size.icon.sm} color={colors.mintDeep} />
          </View>
        </ClayCard>
      )}

      <RecentStrip
        child={child}
        moments={moments}
        emptyEmoji="🩻"
        emptyTitle="Erstes Ultraschallbild"
        emptyText="Haltet die ersten Bilder und Gefühle fest."
      />

      <View style={styles.group}>
        <ClayCard onPress={() => router.push("/hebamme")} style={styles.rowCard} accessibilityLabel="Hebamme finden">
          <Text style={emoji(32)} accessibilityElementsHidden importantForAccessibility="no">
            🤝
          </Text>
          <View style={{ flex: 1 }}>
            <T variant="label">Gut zu wissen</T>
            <T variant="h3">Hebamme finden</T>
          </View>
          <Ionicons name="chevron-forward" size={size.icon.sm} color={colors.muted} />
        </ClayCard>
        <ClayButton
          label="Unser Baby ist da!"
          icon="sparkles"
          variant="soft"
          color={colors.lilac}
          onPress={() => router.push(`/schwangerschaft/geburt?id=${child.id}`)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.section },
  group: { gap: space.sm },
  topRow: { flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.sm, paddingTop: space.xxl * 2 },
  welcome: { alignItems: "center", gap: space.xs, paddingTop: space.xxl, paddingBottom: space.xl },
  welcomeCard: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.gutter },
  hero: { flexDirection: "row", alignItems: "center", gap: space.md },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: space.xs, marginBottom: space.sm },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: space.xxs, minHeight: size.touch, paddingLeft: space.xs },
  strip: { flexDirection: "row", gap: space.sm },
  thumb: { flex: 1 },
  thumbPic: { width: "100%", aspectRatio: 1, borderRadius: radius.md },
  emptyCard: { flexDirection: "row", alignItems: "center", gap: space.md },
  memory: { flexDirection: "row", alignItems: "center", gap: space.md },
  memoryPic: { width: 64, height: 64 },
  tiles: { flexDirection: "row", gap: space.sm },
  tile: { flex: 1, padding: space.md, borderRadius: radius.lg, minHeight: 168 },
  tileBody: { flex: 1, justifyContent: "flex-end", marginTop: space.sm },
  rowCard: { flexDirection: "row", alignItems: "center", gap: space.md },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: space.xxs },
  ideas: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  idea: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    minHeight: size.chip,
    maxWidth: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ideaMore: { backgroundColor: colors.surfaceSoft, gap: space.xxs, paddingRight: space.sm },
});
