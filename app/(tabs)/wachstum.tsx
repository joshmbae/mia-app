import React, { useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BabyProfile, Child, GrowthEntry } from "../../types";
import { useFamily } from "../../utils/family";
import { useChildData } from "../../utils/useChildData";
import { colors, fonts, radius, TAB_BAR_SPACE, type } from "../../utils/theme";
import { ageAtDate, ageText, formatDateShort, formatMonthTag, pregnancyWeek } from "../../utils/dates";
import { formatCm, formatMeasurement, formatWeight, latestValues, momentColor, momentEmoji, momentTitle } from "../../utils/moments";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayButton, ClayCard, IconButton, Squish } from "../../components/ui/Clay";
import { ChoiceChips } from "../../components/ui/Form";
import { GrowthChart } from "../../components/GrowthChart";
import { EmptyHint } from "../../components/MomentBits";

type Metric = "height" | "weight" | "head";

const METRICS: Record<Metric, { label: string; pick: (g: GrowthEntry) => number | undefined; format: (v: number) => string; color: string }> = {
  height: { label: "Größe", pick: (g) => g.heightCm, format: formatCm, color: colors.honey },
  weight: { label: "Gewicht", pick: (g) => g.weightGrams, format: formatWeight, color: colors.sky },
  head: { label: "Kopf", pick: (g) => g.headCm, format: formatCm, color: colors.lilac },
};

export default function GrowthScreen() {
  const { active } = useFamily();

  if (!active) {
    return (
      <Screen bottomSpace={TAB_BAR_SPACE}>
        <Header title="Wachstum" back={false} />
        <Text style={type.body}>Lege zuerst ein Kind an.</Text>
      </Screen>
    );
  }

  if (active.kind === "pregnancy") {
    const { week } = pregnancyWeek(active.profile.dueDate);
    return (
      <Screen bottomSpace={TAB_BAR_SPACE}>
        <Header title="Wachstum" back={false} />
        <ClayCard>
          <EmptyHint
            emoji="📏"
            title="Nach der Geburt geht's hier los"
            text={`Gerade wächst ${active.name} noch im Bauch (SSW ${week}). Sobald euer Baby da ist, tragt ihr hier Größe, Gewicht und Kopfumfang ein — und seht sie direkt im Zeitstrahl.`}
          />
          <ClayButton label="Diese Woche ansehen" variant="soft" icon="leaf" color={colors.mint} onPress={() => router.push(`/schwangerschaft/woche?id=${active.id}`)} />
        </ClayCard>
      </Screen>
    );
  }

  return <Growth child={active} profile={active.profile} />;
}

function Growth({ child, profile }: { child: Child; profile: BabyProfile }) {
  const { moments, growth } = useChildData(child.id);
  const { width } = useWindowDimensions();
  const [metric, setMetric] = useState<Metric>("height");
  const values = latestValues(growth);
  const available = (Object.keys(METRICS) as Metric[]).filter((k) => growth.some((g) => METRICS[k].pick(g)));
  const current = available.includes(metric) ? metric : available[0] ?? "height";
  const m = METRICS[current];
  const points = growth.filter((g) => m.pick(g)).map((g) => ({ date: g.measuredOn, value: m.pick(g)! }));
  const chartWidth = Math.min(width, 560) - 40 - 32;
  const newestFirst = [...growth].reverse();

  const delta = (k: Metric) => {
    const list = growth.filter((g) => METRICS[k].pick(g));
    if (list.length < 2) return null;
    const a = METRICS[k].pick(list[list.length - 2])!;
    const b = METRICS[k].pick(list[list.length - 1])!;
    const d = b - a;
    if (d <= 0) return null;
    return `+${METRICS[k].format(d)} seit ${formatDateShort(list[list.length - 2].measuredOn)}`;
  };

  return (
    <Screen bottomSpace={TAB_BAR_SPACE} blobs="cool" contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Header
        title={`${child.name} wächst`}
        subtitle={ageText(profile.birthDate)}
        back={false}
        right={<IconButton icon="add" label="Neu messen" background={child.color} color={colors.onAccent} onPress={() => router.push(`/messung?child=${child.id}`)} />}
      />

      {growth.length === 0 ? (
        <ClayCard>
          <EmptyHint
            emoji="📏"
            title="Noch keine Messung"
            text="Trag Größe, Gewicht oder Kopfumfang ein — z. B. aus dem gelben U-Heft. Jede Messung erscheint auch im Zeitstrahl."
          />
          <ClayButton label="Erste Messung eintragen" icon="add" color={child.color} onPress={() => router.push(`/messung?child=${child.id}`)} />
        </ClayCard>
      ) : (
        <View style={{ gap: 16 }}>
          <View style={styles.grid}>
            <ValueTile label="Größe" value={values.height ? formatCm(values.height.value) : "–"} note={delta("height") ?? (values.height ? formatDateShort(values.height.on) : "noch nicht gemessen")} bg={colors.sunSoft} fg={colors.sunDeep} glow={colors.sun} />
            <ValueTile label="Gewicht" value={values.weight ? formatWeight(values.weight.value) : "–"} note={delta("weight") ?? (values.weight ? formatDateShort(values.weight.on) : "noch nicht gemessen")} bg={colors.skySoft} fg={colors.skyDeep} glow={colors.sky} />
          </View>
          {values.head && (
            <ClayCard color={colors.lilacSoft} glow={colors.lilac} strength="soft" style={styles.headRow}>
              <Text style={[type.label, { color: colors.lilacDeep, flex: 1 }]}>Kopfumfang</Text>
              <Text style={styles.headValue}>{formatCm(values.head.value)}</Text>
            </ClayCard>
          )}

          <ClayCard>
            {available.length > 1 && (
              <View style={{ marginBottom: 12 }}>
                <ChoiceChips
                  options={available.map((k) => ({ value: k, label: METRICS[k].label }))}
                  value={current}
                  onChange={setMetric}
                  color={m.color}
                />
              </View>
            )}
            {points.length > 1 ? (
              <GrowthChart
                points={points}
                width={chartWidth}
                color={m.color}
                startLabel={formatDateShort(points[0].date)}
                endLabel={formatDateShort(points[points.length - 1].date)}
                moments={moments.map((mo) => ({ id: mo.id, date: mo.happenedOn, emoji: momentEmoji(mo), color: momentColor(mo), title: momentTitle(mo) }))}
                onMomentPress={(id) => router.push(`/moment/${id}?child=${child.id}`)}
              />
            ) : (
              <Text style={type.body}>Ab der zweiten Messung zeigt sich hier {child.name}s Kurve.</Text>
            )}
            <Text style={[type.small, { marginTop: 10 }]}>
              Das ist ganz allein {child.name}s Kurve — jedes Kind wächst in seinem eigenen Tempo. Die Bläschen sind eure Momente.
            </Text>
          </ClayCard>

          <Text style={[type.h3, { marginTop: 4 }]}>Alle Messungen</Text>
          {newestFirst.map((g) => (
            <Squish
              key={g.id}
              onPress={() => router.push(`/messung?child=${child.id}&id=${g.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Messung vom ${formatDateShort(g.measuredOn)} bearbeiten`}
              style={styles.row}
            >
              <View style={styles.monthTag}>
                <Text style={styles.monthText}>{formatMonthTag(g.measuredOn)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.bodyStrong}>{formatMeasurement(g)}</Text>
                <Text style={type.small}>
                  {ageAtDate(profile.birthDate, g.measuredOn)}
                  {g.note ? ` · ${g.note}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Squish>
          ))}
        </View>
      )}
    </Screen>
  );
}

function ValueTile({ label, value, note, bg, fg, glow }: { label: string; value: string; note: string; bg: string; fg: string; glow: string }) {
  return (
    <ClayCard color={bg} glow={glow} style={{ flex: 1 }}>
      <Text style={[type.label, { color: fg }]}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={type.small} numberOfLines={2}>
        {note}
      </Text>
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 14 },
  value: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 40, color: colors.ink, marginVertical: 2 },
  headRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  headValue: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
  },
  monthTag: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.sunSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  monthText: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.sunDeep },
});
