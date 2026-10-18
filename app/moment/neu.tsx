// ─── "Was habt ihr erlebt?" — Moment aus dem Katalog wählen ──────────────────

import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChild } from "../../utils/family";
import { useChildData } from "../../utils/useChildData";
import {
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  MILESTONES,
  MilestoneCategory,
  PREGNANCY_CATEGORY_ORDER,
} from "../../utils/milestoneData";
import { colors, elevation, emoji, MAX_FONT_SCALE, radius, size, soft, solid, space, type } from "../../utils/theme";
import { formatDateShort } from "../../utils/dates";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayCard, Squish } from "../../components/ui/Clay";
import { T } from "../../components/ui/T";

export default function MomentPickerScreen() {
  const params = useLocalSearchParams<{ child?: string }>();
  const child = useChild(params.child);
  const { moments } = useChildData(child?.id);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [category, setCategory] = useState<MilestoneCategory | "alle">("alle");

  const order = child?.kind === "pregnancy" ? PREGNANCY_CATEGORY_ORDER : CATEGORY_ORDER;
  const recorded = useMemo(() => new Map(moments.filter((m) => m.milestoneId).map((m) => [m.milestoneId!, m])), [moments]);
  const q = query.trim().toLowerCase();
  const sections = order
    .filter((c) => category === "alle" || c === category)
    .map((c) => ({ category: c, items: MILESTONES.filter((m) => m.category === c && (!q || m.title.toLowerCase().includes(q))) }))
    .filter((s) => s.items.length > 0);

  if (!child) return <Screen>{null}</Screen>;

  // Der Katalog ist ein Modal: Der Editor ersetzt ihn, damit immer nur ein Modal offen ist.
  const openCustom = () =>
    router.replace(`/moment/bearbeiten?child=${child.id}${q ? `&title=${encodeURIComponent(query.trim())}` : ""}`);

  // Schon festgehaltene Momente: Modal schließen und die Detailseite normal öffnen
  const openEntry = (id: string) => {
    router.dismiss();
    router.push(`/moment/${id}?child=${child.id}`);
  };

  return (
    <Screen keyboard>
      <Header title="Was habt ihr erlebt?" subtitle={child.name} backIcon="close" />

      <View style={[styles.search, focused && styles.searchFocused, elevation.pressed]}>
        <Ionicons name="search" size={size.icon.sm} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Suchen, z. B. Zahn oder Lachen"
          placeholderTextColor={colors.faint}
          maxFontSizeMultiplier={MAX_FONT_SCALE.body}
          style={styles.searchInput}
          accessibilityLabel="Momente durchsuchen"
          returnKeyType="search"
        />
        {query ? (
          <Squish onPress={() => setQuery("")} accessibilityRole="button" accessibilityLabel="Suche leeren" hitSlop={space.sm}>
            <Ionicons name="close-circle" size={size.icon.sm} color={colors.muted} />
          </Squish>
        ) : null}
      </View>

      <ClayCard color={colors.coralSoft} onPress={openCustom} style={styles.custom} accessibilityLabel="Eigenen Moment festhalten">
        <View style={[styles.customIcon, { backgroundColor: solid(colors.coral) }]}>
          <Ionicons name="sparkles" size={size.icon.md} color={colors.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <T variant="h3">{q ? `„${query.trim()}“ festhalten` : "Eigener Moment"}</T>
          <T variant="small">Alles, was euch wichtig ist — auch ein ganz normaler schöner Tag.</T>
        </View>
        <Ionicons name="arrow-forward" size={size.icon.md} color={solid(colors.coral)} />
      </ClayCard>

      {order.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catRow}>
          <CatChip label="Alle" emoji="🌼" active={category === "alle"} fill={colors.ink} onPress={() => setCategory("alle")} />
          {order.map((c) => (
            <CatChip
              key={c}
              label={CATEGORY_LABELS[c]}
              emoji={CATEGORY_EMOJIS[c]}
              active={category === c}
              fill={solid(CATEGORY_COLORS[c])}
              onPress={() => setCategory(c)}
            />
          ))}
        </ScrollView>
      )}

      {sections.map((s) => (
        <View key={s.category} style={styles.section}>
          <T variant="h3" accessibilityRole="header" style={styles.sectionTitle}>
            {CATEGORY_EMOJIS[s.category]}  {CATEGORY_LABELS[s.category]}
          </T>
          <View style={styles.grid}>
            {s.items.map((m) => {
              const entry = recorded.get(m.id);
              const color = CATEGORY_COLORS[m.category];
              const fg = solid(color);
              return (
                <Squish
                  key={m.id}
                  onPress={() => (entry ? openEntry(entry.id) : router.replace(`/moment/bearbeiten?child=${child.id}&milestone=${m.id}`))}
                  accessibilityRole="button"
                  accessibilityLabel={entry ? `${m.title}, festgehalten am ${formatDateShort(entry.happenedOn)}` : `${m.title} festhalten`}
                  style={[styles.tile, { backgroundColor: entry ? soft(color) : colors.surface }, elevation.raised]}
                >
                  <View style={[styles.tileEmoji, { backgroundColor: entry ? colors.surface : soft(color) }]}>
                    <Text style={emoji(24)}>{m.emoji}</Text>
                  </View>
                  <T variant="h3" numberOfLines={2}>
                    {m.title}
                  </T>
                  <View style={styles.tileFoot}>
                    <Ionicons name={entry ? "heart" : "add"} size={14} color={fg} />
                    <T variant="caption" color={fg} numberOfLines={1} style={{ flexShrink: 1 }}>
                      {entry ? formatDateShort(entry.happenedOn) : "festhalten"}
                    </T>
                  </View>
                </Squish>
              );
            })}
          </View>
        </View>
      ))}

      {sections.length === 0 && (
        <T variant="body" align="center" style={styles.empty}>
          Nichts Passendes im Katalog — haltet es einfach als eigenen Moment fest.
        </T>
      )}
    </Screen>
  );
}

function CatChip({ label, emoji: icon, active, fill, onPress }: { label: string; emoji: string; active: boolean; fill: string; onPress: () => void }) {
  return (
    <Squish
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[styles.catChip, active ? { backgroundColor: fill, borderColor: fill } : null]}
    >
      <Text style={emoji(16)} accessibilityElementsHidden importantForAccessibility="no">
        {icon}
      </Text>
      <T variant="chip" color={active ? colors.onAccent : colors.ink}>
        {label}
      </T>
    </Squish>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    minHeight: size.input,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: space.md,
    marginBottom: space.md,
  },
  searchFocused: { borderColor: colors.peach, backgroundColor: colors.surface },
  searchInput: { ...type.bodyStrong, flex: 1, color: colors.ink, minHeight: size.input - 4, paddingVertical: space.xs },
  custom: { flexDirection: "row", alignItems: "center", gap: space.sm },
  customIcon: { width: size.touch + 4, height: size.touch + 4, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  catScroll: { marginHorizontal: -space.gutter, marginTop: space.lg, flexGrow: 0 },
  catRow: { paddingHorizontal: space.gutter, gap: space.xs },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    minHeight: size.chip + 4,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: space.md,
  },
  section: { marginTop: space.lg },
  sectionTitle: { marginBottom: space.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  tile: {
    flexBasis: "45%",
    flexGrow: 1,
    maxWidth: "50%",
    borderRadius: radius.lg,
    padding: space.md,
    minHeight: 136,
  },
  tileEmoji: { width: size.touch, height: size.touch, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", marginBottom: space.sm },
  tileFoot: { flexDirection: "row", alignItems: "center", gap: space.xxs, marginTop: "auto", paddingTop: space.xs },
  empty: { marginTop: space.lg },
});
