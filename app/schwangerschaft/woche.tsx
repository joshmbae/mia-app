// ─── Schwangerschaft: Was gerade passiert — Woche für Woche ──────────────────

import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChild } from "../../utils/family";
import { PREGNANCY_BLOCKS, PREGNANCY_MILESTONES, getPregnancyBlock } from "../../utils/pregnancyDevelopmentContent";
import { pregnancyWeek, todayISO } from "../../utils/dates";
import { Child } from "../../types";
import { colors, fonts, radius, type } from "../../utils/theme";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayButton, ClayCard, IconButton, Pill } from "../../components/ui/Clay";

export default function PregnancyWeekScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const child = useChild(params.id);
  if (!child || child.kind !== "pregnancy") {
    return (
      <Screen>
        <Header title="Diese Woche" />
      </Screen>
    );
  }
  // Erst rendern, wenn die Schwangerschaft geladen ist — die Woche ist der Startwert
  return <WeekContent key={child.id} child={child} />;
}

function WeekContent({ child }: { child: Child }) {
  const due = child.kind === "pregnancy" ? child.profile.dueDate : todayISO();
  const { week } = pregnancyWeek(due);
  const currentIndex = Math.max(0, PREGNANCY_BLOCKS.indexOf(getPregnancyBlock(Math.max(4, week))));
  const [index, setIndex] = useState(currentIndex);

  const block = PREGNANCY_BLOCKS[index];
  const isNow = index === currentIndex;
  const trimesterLabel = ["", "1. Trimester", "2. Trimester", "3. Trimester"][block.trimester];

  return (
    <Screen blobs="cool" contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Header title={isNow ? "Diese Woche" : block.ageLabel} subtitle={child.name} />

      {/* Wochen-Blättern */}
      <View style={styles.pager}>
        <IconButton icon="chevron-back" label="Vorherige Wochen" onPress={() => setIndex((i) => Math.max(0, i - 1))} style={index === 0 ? { opacity: 0.4 } : undefined} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={type.h2}>{block.ageLabel}</Text>
          <Text style={type.small}>{isNow ? `Ihr seid gerade in SSW ${week}` : trimesterLabel}</Text>
        </View>
        <IconButton
          icon="chevron-forward"
          label="Nächste Wochen"
          onPress={() => setIndex((i) => Math.min(PREGNANCY_BLOCKS.length - 1, i + 1))}
          style={index === PREGNANCY_BLOCKS.length - 1 ? { opacity: 0.4 } : undefined}
        />
      </View>
      {!isNow && (
        <ClayButton label="Zurück zur aktuellen Woche" variant="ghost" size="md" color={colors.lilac} onPress={() => setIndex(currentIndex)} />
      )}

      <ClayCard color={colors.mintSoft} glow={colors.mint} style={styles.hero}>
        <Text style={[type.label, { color: colors.mintDeep }]}>Euer Baby ist so groß wie</Text>
        <Text style={[type.hero, { textAlign: "center" }]}>{block.babySize}</Text>
        <Pill label={`${block.babyWeightApprox} · ${trimesterLabel}`} />
      </ClayCard>

      <Section emoji="👶" title="Beim Baby" items={block.babyDev} color={colors.mint} />
      <Section emoji="🤍" title="Dein Körper" items={block.bodyChanges} color={colors.coral} />
      <Section emoji="🌿" title="Ganz normal" items={block.isNormal} color={colors.sky} />
      <Section emoji="📝" title="Gut zu erledigen" items={block.todos} color={colors.honey} />
      <Section emoji="💡" title="Tipps" items={block.tips} color={colors.lilac} />

      <ClayCard color={colors.lilacSoft} glow={colors.lilac} style={styles.card}>
        <Text style={styles.cardTitle}>💜  Für dich</Text>
        <Text style={type.body}>{block.forParents}</Text>
      </ClayCard>

      <ClayCard color={colors.surfaceSoft} strength="soft" style={styles.card}>
        <Text style={styles.cardTitle}>☎️  Melde dich bei Hebamme oder Ärztin, wenn …</Text>
        {block.watchOut.map((t, i) => (
          <Bullet key={i} text={t} color={colors.danger} />
        ))}
        <Text style={[type.small, { marginTop: 6 }]}>Lieber einmal zu oft anrufen — dafür sind sie da. Im Notfall: 112.</Text>
      </ClayCard>

      <ClayCard style={styles.card}>
        <Text style={styles.cardTitle}>🔜  Als Nächstes</Text>
        <Text style={type.body}>{block.nextWeekPreview}</Text>
      </ClayCard>

      <Text style={[type.h3, { marginTop: 10, marginBottom: 12 }]}>Die ganze Reise</Text>
      <ClayCard style={{ gap: 2 }}>
        {PREGNANCY_MILESTONES.map((m, i) => {
          const passed = week >= m.ssw;
          return (
            <View key={i} style={styles.journeyRow}>
              <View style={[styles.journeyDot, { backgroundColor: passed ? colors.mint : colors.line }]}>
                {passed && <Ionicons name="checkmark" size={12} color={colors.onAccent} />}
              </View>
              <Text style={[styles.journeyWeek, passed && { color: colors.mintDeep }]}>SSW {m.ssw}</Text>
              <Text style={[type.body, { flex: 1, color: passed ? colors.ink : colors.inkSoft }]}>
                {m.emoji}  {m.label}
              </Text>
            </View>
          );
        })}
      </ClayCard>

      <ClayButton label="Hebamme finden" icon="people" variant="soft" color={colors.coral} onPress={() => router.push("/hebamme")} style={{ marginTop: 20 }} />
    </Screen>
  );
}

function Section({ emoji, title, items, color }: { emoji: string; title: string; items: string[]; color: string }) {
  if (!items.length) return null;
  return (
    <ClayCard style={styles.card} strength="soft" glow={color}>
      <Text style={styles.cardTitle}>
        {emoji}  {title}
      </Text>
      {items.map((t, i) => (
        <Bullet key={i} text={t} color={color} />
      ))}
    </ClayCard>
  );
}

function Bullet({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.bullet}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[type.body, { flex: 1, fontSize: 14.5 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pager: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  hero: { alignItems: "center", gap: 8, paddingVertical: 24, marginVertical: 14, borderRadius: radius.xl },
  card: { marginBottom: 14 },
  cardTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.ink, marginBottom: 10 },
  bullet: { flexDirection: "row", gap: 10, marginBottom: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 8 },
  journeyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  journeyDot: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  journeyWeek: { fontFamily: fonts.bodyHeavy, fontSize: 12.5, color: colors.muted, width: 58 },
});
