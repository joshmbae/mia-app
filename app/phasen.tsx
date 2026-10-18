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
import { colors, fonts, radius, tint, type } from "../utils/theme";
import { Header, Screen } from "../components/ui/Screen";
import { ClayCard, Squish } from "../components/ui/Clay";

export default function PhasesScreen() {
  const { active } = useFamily();
  if (!active || active.kind !== "baby") {
    return (
      <Screen>
        <Header title="Phasen" />
        <Text style={type.body}>Die Phasen beginnen mit der Geburt.</Text>
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
    <Screen blobs="cool" contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Header title="Phasen" subtitle={`${name}s erste drei Jahre`} />

      <ClayCard color={colors.surfaceSoft} strength="soft" style={styles.note}>
        <Text style={{ fontSize: 22 }}>🧭</Text>
        <Text style={[type.body, { flex: 1 }]}>
          Keine Checkliste — die Phasen erzählen nur, was viele Familien in einer Zeit ungefähr erleben. Euer Weg darf ganz anders aussehen.
          {corrected ? " Bei Frühchen rechnen wir mit dem korrigierten Alter." : ""}
        </Text>
      </ClayCard>

      {current && (
        <ClayCard color={colors.mintSoft} glow={colors.mint} style={{ marginBottom: 22 }}>
          <View style={styles.titleRow}>
            <View style={[styles.emojiWrap, { backgroundColor: colors.surface }]}>
              <Text style={{ fontSize: 26 }}>{current.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.label, { color: colors.mintDeep }]}>Gerade · {current.ageLabel}</Text>
              <Text style={type.h2}>{current.title}</Text>
            </View>
          </View>
          <PhaseBody phase={current} moments={momentsIn(current)} childId={childId} />
        </ClayCard>
      )}

      <Text style={[type.h3, { marginBottom: 12 }]}>Alle Phasen</Text>
      {DEVELOPMENT_PHASES.map((p) => {
        const isOpen = open === p.id;
        const isCurrent = current?.id === p.id;
        const count = momentsIn(p).length;
        const future = weeks < p.weeksFrom;
        return (
          <ClayCard
            key={p.id}
            strength="soft"
            color={isCurrent ? colors.mintSoft : colors.surface}
            glow={isCurrent ? colors.mint : colors.coral}
            style={{ marginBottom: 12 }}
            onPress={() => setOpen(isOpen ? null : p.id)}
            accessibilityLabel={`${p.title}, ${isOpen ? "zuklappen" : "aufklappen"}`}
          >
            <View style={styles.titleRow}>
              <View style={[styles.emojiWrap, { backgroundColor: isCurrent ? colors.surface : colors.bg }]}>
                <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.h3}>{p.title}</Text>
                <Text style={type.small}>
                  {p.ageLabel}
                  {isCurrent ? " · jetzt" : future ? "" : count ? ` · ${count} ${count === 1 ? "Moment" : "Momente"}` : ""}
                </Text>
              </View>
              <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
            </View>
            {isOpen && <PhaseBody phase={p} moments={momentsIn(p)} childId={childId} future={future} />}
          </ClayCard>
        );
      })}

      <Text style={[type.small, { textAlign: "center", marginTop: 10 }]}>
        Inhalte angelehnt an CDC, AAP und WHO. Wenn dich etwas beschäftigt, sprich jederzeit mit deiner Hebamme oder Kinderärztin — dafür braucht es keinen Anlass.
      </Text>
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
    <View style={{ marginTop: 14, gap: 12 }}>
      <Text style={[type.body, { color: colors.ink }]}>{phase.summary}</Text>
      <View>
        <Text style={[type.label, { marginBottom: 8 }]}>Was viele Familien {future ? "in dieser Zeit" : "gerade"} erleben</Text>
        {phase.typical.map((t, i) => (
          <View key={i} style={styles.bullet}>
            <View style={[styles.dot, { backgroundColor: colors.honey }]} />
            <Text style={[type.body, { flex: 1, fontSize: 14.5 }]}>{t}</Text>
          </View>
        ))}
      </View>
      {phase.developmentHint && <InfoBox emoji="🌪️" title="Unruhigere Zeit?" text={phase.developmentHint} bg={colors.sunSoft} />}
      <InfoBox emoji="💡" title="Kleine Idee" text={phase.parentTip} bg={colors.skySoft} />
      <InfoBox emoji="💜" title="Für dich" text={phase.forParents} bg={colors.lilacSoft} />
      {moments.length > 0 && (
        <View>
          <Text style={[type.label, { marginBottom: 8 }]}>Eure Momente aus dieser Zeit</Text>
          <View style={styles.chips}>
            {moments.map((m) => (
              <Squish
                key={m.id}
                onPress={() => router.push(`/moment/${m.id}?child=${childId}`)}
                accessibilityRole="button"
                accessibilityLabel={momentTitle(m)}
                style={[styles.chip, { backgroundColor: tint(momentColor(m), 0.16) }]}
              >
                <Text style={{ fontSize: 14 }}>{momentEmoji(m)}</Text>
                <Text style={[styles.chipText, { color: colors.ink }]} numberOfLines={1}>
                  {momentTitle(m)}
                </Text>
              </Squish>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function InfoBox({ emoji, title, text, bg }: { emoji: string; title: string; text: string; bg: string }) {
  return (
    <View style={[styles.info, { backgroundColor: bg }]}>
      <Text style={styles.infoTitle}>
        {emoji}  {title}
      </Text>
      <Text style={[type.body, { fontSize: 14 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 18 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  emojiWrap: { width: 48, height: 48, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  bullet: { flexDirection: "row", gap: 10, marginBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 8 },
  info: { borderRadius: radius.md, padding: 14 },
  infoTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, marginBottom: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8, maxWidth: "100%" },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 13, flexShrink: 1 },
});
