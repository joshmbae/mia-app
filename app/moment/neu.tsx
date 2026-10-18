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
import { colors, clay, fonts, radius, tint, type } from "../../utils/theme";
import { formatDateShort } from "../../utils/dates";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayCard, Squish } from "../../components/ui/Clay";

export default function MomentPickerScreen() {
  const params = useLocalSearchParams<{ child?: string }>();
  const child = useChild(params.child);
  const { moments } = useChildData(child?.id);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MilestoneCategory | "alle">("alle");

  const order = child?.kind === "pregnancy" ? PREGNANCY_CATEGORY_ORDER : CATEGORY_ORDER;
  const recorded = useMemo(() => new Map(moments.filter((m) => m.milestoneId).map((m) => [m.milestoneId!, m])), [moments]);
  const q = query.trim().toLowerCase();
  const sections = order
    .filter((c) => category === "alle" || c === category)
    .map((c) => ({ category: c, items: MILESTONES.filter((m) => m.category === c && (!q || m.title.toLowerCase().includes(q))) }))
    .filter((s) => s.items.length > 0);

  if (!child) return <Screen>{null}</Screen>;

  const openCustom = () =>
    router.replace(`/moment/bearbeiten?child=${child.id}${q ? `&title=${encodeURIComponent(query.trim())}` : ""}`);

  return (
    <Screen keyboard>
      <Header title="Was habt ihr erlebt?" subtitle={child.name} backIcon="close" />

      <View style={[styles.search, clay(colors.coral, "soft")]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Suchen, z. B. Zahn oder Lachen"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          accessibilityLabel="Momente durchsuchen"
          returnKeyType="search"
        />
        {query ? (
          <Squish onPress={() => setQuery("")} accessibilityRole="button" accessibilityLabel="Suche leeren" hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Squish>
        ) : null}
      </View>

      <ClayCard color={colors.coralSoft} glow={colors.coral} onPress={openCustom} style={styles.custom} accessibilityLabel="Eigenen Moment festhalten">
        <View style={[styles.customIcon, { backgroundColor: colors.coral }]}>
          <Ionicons name="sparkles" size={24} color={colors.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={type.h3}>{q ? `„${query.trim()}“ festhalten` : "Eigener Moment"}</Text>
          <Text style={type.small}>Alles, was euch wichtig ist — auch ein ganz normaler schöner Tag.</Text>
        </View>
        <Ionicons name="arrow-forward" size={22} color={colors.coral} />
      </ClayCard>

      {order.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catRow}>
          <CatChip label="Alle" emoji="🌼" active={category === "alle"} color={colors.ink} onPress={() => setCategory("alle")} />
          {order.map((c) => (
            <CatChip key={c} label={CATEGORY_LABELS[c]} emoji={CATEGORY_EMOJIS[c]} active={category === c} color={CATEGORY_COLORS[c]} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
      )}

      {sections.map((s) => (
        <View key={s.category} style={{ marginTop: 18 }}>
          <Text style={[type.h3, { marginBottom: 10 }]}>
            {CATEGORY_EMOJIS[s.category]}  {CATEGORY_LABELS[s.category]}
          </Text>
          <View style={styles.grid}>
            {s.items.map((m) => {
              const entry = recorded.get(m.id);
              const color = CATEGORY_COLORS[m.category];
              return (
                <Squish
                  key={m.id}
                  onPress={() =>
                    entry
                      ? router.replace(`/moment/${entry.id}?child=${child.id}`)
                      : router.replace(`/moment/bearbeiten?child=${child.id}&milestone=${m.id}`)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={entry ? `${m.title}, festgehalten am ${formatDateShort(entry.happenedOn)}` : m.title}
                  style={[styles.tile, entry ? { backgroundColor: tint(color, 0.14) } : null, clay(color, "soft")]}
                >
                  <View style={[styles.tileEmoji, { backgroundColor: entry ? colors.surface : tint(color, 0.14) }]}>
                    <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                  </View>
                  <Text style={styles.tileTitle} numberOfLines={2}>
                    {m.title}
                  </Text>
                  <View style={styles.tileFoot}>
                    <Ionicons name={entry ? "heart" : "add"} size={13} color={color} />
                    <Text style={[styles.tileFootText, { color }]}>{entry ? formatDateShort(entry.happenedOn) : "festhalten"}</Text>
                  </View>
                </Squish>
              );
            })}
          </View>
        </View>
      ))}

      {sections.length === 0 && (
        <Text style={[type.body, { textAlign: "center", marginTop: 24 }]}>
          Nichts Passendes im Katalog — halte es einfach als eigenen Moment fest.
        </Text>
      )}
    </Screen>
  );
}

function CatChip({ label, emoji, active, color, onPress }: { label: string; emoji: string; active: boolean; color: string; onPress: () => void }) {
  return (
    <Squish
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.catChip, active ? { backgroundColor: color } : null]}
    >
      <Text style={{ fontSize: 15 }}>{emoji}</Text>
      <Text style={[styles.catText, active && { color: colors.onAccent }]}>{label}</Text>
    </Squish>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink, height: 50 },
  custom: { flexDirection: "row", alignItems: "center", gap: 14 },
  customIcon: { width: 48, height: 48, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  catScroll: { marginHorizontal: -20, marginTop: 18, flexGrow: 0 },
  catRow: { paddingHorizontal: 20, gap: 8 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 42,
  },
  catText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    minHeight: 136,
  },
  tileEmoji: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  tileTitle: { fontFamily: fonts.display, fontSize: 15.5, lineHeight: 20, color: colors.ink },
  tileFoot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: "auto", paddingTop: 8 },
  tileFootText: { fontFamily: fonts.bodyHeavy, fontSize: 12 },
});
