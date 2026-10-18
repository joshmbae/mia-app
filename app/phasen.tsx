// ─── Phasen: was viele Familien in einer Zeit erleben — keine Checkliste ─────

import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BabyProfile, MomentEntry } from "../types";
import { useFamily } from "../utils/family";
import { useChildData } from "../utils/useChildData";
import { DEVELOPMENT_PHASES, DevelopmentPhase, getAgeWeeks, getCurrentPhase, getPhaseForDate } from "../utils/developmentPhases";
import { phaseReferenceDate } from "../utils/dates";
import { momentColor, momentEmoji, momentTitle } from "../utils/moments";
import { colors, emoji, radius, size, soft, solid, space } from "../utils/theme";
import { Header, Screen } from "../components/ui/Screen";
import { ClayCard, Squish } from "../components/ui/Clay";
import { T } from "../components/ui/T";

/** Entfernt einen angehängten Quellen-Satz ("… Quelle: AAP.") — nur für die Anzeige */
function withoutSource(text: string): string {
  return text.replace(/\s*Quelle:[^]*$/, "").trim();
}

export default function PhasesScreen() {
  const { active } = useFamily();
  if (!active || active.kind !== "baby") {
    return (
      <Screen>
        <Header title="Phasen" />
        <T variant="body">Die Phasen beginnen mit der Geburt.</T>
      </Screen>
    );
  }
  return <Phases childId={active.id} name={active.name} profile={active.profile} />;
}

function Phases({ childId, name, profile }: { childId: string; name: string; profile: BabyProfile }) {
  const { moments } = useChildData(childId);
  const ref = phaseReferenceDate(profile);
  const current = getCurrentPhase(ref);
  const weeks = getAgeWeeks(ref);
  const [open, setOpen] = useState<string | null>(null);
  const corrected = ref !== profile.birthDate;

  const momentsIn = (p: DevelopmentPhase) => moments.filter((m) => getPhaseForDate(ref, m.happenedOn)?.id === p.id);

  return (
    <Screen blobs="cool" contentStyle={styles.content}>
      <Header title="Phasen" subtitle={`${name}s erste drei Jahre`} />

      <ClayCard color={colors.surfaceSoft} lift="flat" style={styles.note}>
        <Text style={emoji(24)} accessibilityElementsHidden importantForAccessibility="no">
          🧭
        </Text>
        <T variant="body" style={styles.flex}>
          Keine Checkliste — die Phasen erzählen nur, was viele Familien in einer Zeit ungefähr erleben. Euer Weg darf ganz anders aussehen.
          {corrected ? " Bei Frühchen rechnen wir mit dem korrigierten Alter." : ""}
        </T>
      </ClayCard>

      {current && (
        <ClayCard color={soft(colors.mint)} lift="float" style={styles.current}>
          <View style={styles.titleRow}>
            <View style={[styles.emojiWrap, { backgroundColor: colors.surface }]}>
              <Text style={emoji(32)} accessibilityElementsHidden importantForAccessibility="no">
                {current.emoji}
              </Text>
            </View>
            <View style={styles.flex}>
              <T variant="label" color={solid(colors.mint)}>
                Gerade · {current.ageLabel}
              </T>
              <T variant="h2" accessibilityRole="header">
                {current.title}
              </T>
            </View>
          </View>
          <PhaseBody phase={current} moments={momentsIn(current)} childId={childId} />
        </ClayCard>
      )}

      <T variant="h3" accessibilityRole="header" style={styles.listTitle}>
        Alle Phasen
      </T>
      <View style={styles.list}>
        {DEVELOPMENT_PHASES.map((p) => {
          const isOpen = open === p.id;
          const isCurrent = current?.id === p.id;
          const count = momentsIn(p).length;
          const future = weeks < p.weeksFrom;
          return (
            <ClayCard
              key={p.id}
              color={isCurrent ? soft(colors.mint) : colors.surface}
              onPress={() => setOpen(isOpen ? null : p.id)}
              accessibilityLabel={`${p.title}, ${p.ageLabel}${isCurrent ? ", jetzt" : ""}. ${isOpen ? "Zuklappen" : "Aufklappen"}`}
            >
              <View style={styles.titleRow}>
                <View style={[styles.emojiWrap, { backgroundColor: isCurrent ? colors.surface : colors.surfaceSoft }]}>
                  <Text style={emoji(24)} accessibilityElementsHidden importantForAccessibility="no">
                    {p.emoji}
                  </Text>
                </View>
                <View style={styles.flex}>
                  <T variant="h3">{p.title}</T>
                  <T variant="small">
                    {p.ageLabel}
                    {isCurrent ? " · jetzt" : future ? "" : count ? ` · ${count} ${count === 1 ? "Moment" : "Momente"}` : ""}
                  </T>
                </View>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={size.icon.sm} color={colors.muted} />
              </View>
              {isOpen && <PhaseBody phase={p} moments={momentsIn(p)} childId={childId} future={future} />}
            </ClayCard>
          );
        })}
      </View>

      <T variant="caption" color={colors.muted} align="center" style={styles.footer}>
        Inhalte angelehnt an CDC, AAP und WHO. Wenn euch etwas beschäftigt, sprecht jederzeit mit eurer Hebamme oder Kinderärztin — dafür braucht es keinen Anlass.
      </T>
    </Screen>
  );
}

function PhaseBody({
  phase,
  moments,
  childId,
  future,
}: {
  phase: DevelopmentPhase;
  moments: MomentEntry[];
  childId: string;
  future?: boolean;
}) {
  return (
    <View style={styles.body}>
      <T variant="bodyLong" color={colors.ink}>
        {phase.summary}
      </T>
      <View>
        <T variant="label" style={styles.blockLabel}>
          Was viele Familien {future ? "in dieser Zeit" : "gerade"} erleben
        </T>
        {phase.typical.map((t, i) => (
          <View key={i} style={styles.bullet}>
            <View style={[styles.dot, { backgroundColor: colors.honey }]} />
            <T variant="bodyLong" style={styles.flex}>
              {t}
            </T>
          </View>
        ))}
      </View>
      {phase.developmentHint && <InfoBox emoji="🌪️" title="Unruhigere Zeit?" text={withoutSource(phase.developmentHint)} bg={colors.sunSoft} />}
      <InfoBox emoji="💡" title="Kleine Idee" text={phase.parentTip} bg={colors.skySoft} />
      <InfoBox emoji="💜" title="Für dich" text={phase.forParents} bg={colors.lilacSoft} />
      {moments.length > 0 && (
        <View>
          <T variant="label" style={styles.blockLabel}>
            Eure Momente aus dieser Zeit
          </T>
          <View style={styles.chips}>
            {moments.map((m) => (
              <Squish
                key={m.id}
                onPress={() => router.push(`/moment/${m.id}?child=${childId}`)}
                accessibilityRole="button"
                accessibilityLabel={`Moment: ${momentTitle(m)}`}
                style={[styles.chip, { backgroundColor: soft(momentColor(m)) }]}
              >
                <Text style={emoji(16)} accessibilityElementsHidden importantForAccessibility="no">
                  {momentEmoji(m)}
                </Text>
                <T variant="chip" numberOfLines={1} style={styles.chipText}>
                  {momentTitle(m)}
                </T>
              </Squish>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function InfoBox({ emoji: icon, title, text, bg }: { emoji: string; title: string; text: string; bg: string }) {
  return (
    <View style={[styles.info, { backgroundColor: bg }]}>
      <View style={styles.infoHead}>
        <Text style={emoji(20)} accessibilityElementsHidden importantForAccessibility="no">
          {icon}
        </Text>
        <T variant="h3">{title}</T>
      </View>
      <T variant="bodyLong">{text}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 560, width: "100%", alignSelf: "center" },
  flex: { flex: 1 },
  note: { flexDirection: "row", gap: space.sm, alignItems: "flex-start", marginBottom: space.lg, borderWidth: 1, borderColor: colors.line },
  current: { marginBottom: space.section },
  titleRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  emojiWrap: { width: size.buttonSm, height: size.buttonSm, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  listTitle: { marginBottom: space.sm },
  list: { gap: space.sm },
  body: { marginTop: space.md, gap: space.md },
  blockLabel: { marginBottom: space.xs },
  bullet: { flexDirection: "row", gap: space.sm, marginBottom: space.xxs },
  dot: { width: space.xs, height: space.xs, borderRadius: radius.pill, marginTop: space.sm - 1 },
  info: { borderRadius: radius.md, padding: space.md, gap: space.xxs },
  infoHead: { flexDirection: "row", alignItems: "center", gap: space.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xxs + 2,
    minHeight: size.chip,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    maxWidth: "100%",
  },
  chipText: { flexShrink: 1 },
  footer: { marginTop: space.lg, paddingHorizontal: space.md },
});
