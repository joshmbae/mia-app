// ─── Schwangerschaft: Was gerade passiert — Woche für Woche ──────────────────

import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChild } from "../../utils/family";
import { PREGNANCY_BLOCKS, PREGNANCY_MILESTONES, getPregnancyBlock } from "../../utils/pregnancyDevelopmentContent";
import { pregnancyWeek, todayISO } from "../../utils/dates";
import { Child } from "../../types";
import { colors, elevation, emoji, radius, size, solid, space } from "../../utils/theme";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayButton, ClayCard, Pill, Squish } from "../../components/ui/Clay";
import { T } from "../../components/ui/T";

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
  const atStart = index === 0;
  const atEnd = index === PREGNANCY_BLOCKS.length - 1;

  return (
    <Screen blobs="cool" contentStyle={styles.content}>
      <Header title={isNow ? "Diese Woche" : block.ageLabel} subtitle={child.name} />

      {/* Wochen-Blättern */}
      <View style={styles.pager}>
        <PagerButton icon="chevron-back" label="Vorherige Wochen" disabled={atStart} onPress={() => setIndex((i) => Math.max(0, i - 1))} />
        <View style={styles.pagerText}>
          <T variant="h2" align="center">
            {block.ageLabel}
          </T>
          <T variant="small" align="center">
            {isNow ? `Ihr seid gerade in SSW ${week}` : trimesterLabel}
          </T>
        </View>
        <PagerButton
          icon="chevron-forward"
          label="Nächste Wochen"
          disabled={atEnd}
          onPress={() => setIndex((i) => Math.min(PREGNANCY_BLOCKS.length - 1, i + 1))}
        />
      </View>
      {!isNow && (
        <ClayButton label="Zurück zur aktuellen Woche" variant="ghost" size="md" color={colors.lilac} onPress={() => setIndex(currentIndex)} />
      )}

      <ClayCard color={colors.mintSoft} lift="float" style={styles.hero}>
        <T variant="label" color={solid(colors.mint)} align="center">
          Euer Baby ist so groß wie
        </T>
        <T variant="hero" align="center">
          {block.babySize}
        </T>
        <Pill label={`${block.babyWeightApprox} · ${trimesterLabel}`} color={colors.mint} background={colors.surface} center />
      </ClayCard>

      <View style={styles.group}>
        <Section icon="👶" title="Beim Baby" items={block.babyDev} color={colors.mint} />
        <Section icon="🤍" title="Dein Körper" items={block.bodyChanges} color={colors.coral} />
        <Section icon="🌿" title="Ganz normal" items={block.isNormal} color={colors.sky} />
        <Section icon="📝" title="Gut zu erledigen" items={block.todos} color={colors.honey} />
        <Section icon="💡" title="Tipps" items={block.tips} color={colors.lilac} />

        <ClayCard color={colors.lilacSoft} style={styles.card}>
          <CardTitle icon="💜" title="Für dich" />
          <T variant="bodyLong">{block.forParents}</T>
        </ClayCard>

        <ClayCard style={styles.card}>
          <CardTitle icon="☎️" title="Melde dich bei Hebamme oder Ärztin, wenn …" />
          <View style={styles.list}>
            {block.watchOut.map((t, i) => (
              <Bullet key={i} text={t} color={colors.danger} />
            ))}
          </View>
          <T variant="small" style={styles.note}>
            Lieber einmal zu oft anrufen — dafür sind sie da. Im Notfall: 112.
          </T>
        </ClayCard>

        <ClayCard style={styles.card}>
          <CardTitle icon="🔜" title="Als Nächstes" />
          <T variant="bodyLong">{block.nextWeekPreview}</T>
        </ClayCard>
      </View>

      <T variant="h2" accessibilityRole="header" style={styles.sectionTitle}>
        Die ganze Reise
      </T>
      <ClayCard style={styles.journey}>
        {PREGNANCY_MILESTONES.map((m, i) => {
          const passed = week >= m.ssw;
          return (
            <View key={i} style={styles.journeyRow}>
              <View style={[styles.journeyDot, { backgroundColor: passed ? solid(colors.mint) : colors.line }]}>
                {passed && <Ionicons name="checkmark" size={14} color={colors.onAccent} />}
              </View>
              <T variant="caption" color={passed ? solid(colors.mint) : colors.muted} style={styles.journeyWeek}>
                SSW {m.ssw}
              </T>
              <T variant="body" color={passed ? colors.ink : colors.inkSoft} style={styles.flex}>
                {m.emoji}  {m.label}
              </T>
            </View>
          );
        })}
      </ClayCard>

      <ClayButton label="Hebamme finden" icon="people" variant="soft" color={colors.coral} onPress={() => router.push("/hebamme")} style={styles.cta} />
    </Screen>
  );
}

function PagerButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: "chevron-back" | "chevron-forward";
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Squish
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={[styles.pagerButton, disabled ? styles.pagerButtonOff : elevation.raised]}
    >
      <Ionicons name={icon} size={size.icon.md} color={disabled ? colors.faint : colors.ink} />
    </Squish>
  );
}

function CardTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.cardTitle}>
      <Text style={emoji(20)} accessibilityElementsHidden importantForAccessibility="no">
        {icon}
      </Text>
      <T variant="h3" accessibilityRole="header" style={styles.flex}>
        {title}
      </T>
    </View>
  );
}

function Section({ icon, title, items, color }: { icon: string; title: string; items: string[]; color: string }) {
  if (!items.length) return null;
  return (
    <ClayCard style={styles.card}>
      <CardTitle icon={icon} title={title} />
      <View style={styles.list}>
        {items.map((t, i) => (
          <Bullet key={i} text={t} color={color} />
        ))}
      </View>
    </ClayCard>
  );
}

function Bullet({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.bullet}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <T variant="body" style={styles.flex}>
        {text}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 560, width: "100%", alignSelf: "center" },
  flex: { flex: 1 },
  pager: { flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.xs },
  pagerText: { flex: 1, alignItems: "center" },
  pagerButton: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  pagerButtonOff: { backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.line },
  hero: { alignItems: "center", gap: space.xs, paddingVertical: space.lg, marginTop: space.md, borderRadius: radius.xl },
  group: { gap: space.sm, marginTop: space.section },
  card: { padding: space.md, gap: space.sm },
  cardTitle: { flexDirection: "row", alignItems: "center", gap: space.xs },
  list: { gap: space.xs },
  bullet: { flexDirection: "row", gap: space.sm },
  dot: { width: space.xs, height: space.xs, borderRadius: radius.pill, marginTop: space.xs },
  note: { marginTop: space.xxs },
  sectionTitle: { marginTop: space.section, marginBottom: space.sm },
  journey: { gap: space.xxs },
  journeyRow: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.xxs + 2 },
  journeyDot: { width: size.icon.md, height: size.icon.md, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  journeyWeek: { width: 56 },
  cta: { marginTop: space.lg },
});
