import React, { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BabyProfile, Child, GrowthEntry } from "../../types";
import { useFamily } from "../../utils/family";
import { useChildData } from "../../utils/useChildData";
import { colors, radius, size, soft, solid, space } from "../../utils/theme";
import { ageAtDate, ageText, formatDateShort, formatMonthTag, pregnancyWeek } from "../../utils/dates";
import { formatCm, formatMeasurement, formatWeight, latestValues, momentColor, momentEmoji, momentTitle } from "../../utils/moments";
import { Header, Screen, useTabBarSpace } from "../../components/ui/Screen";
import { ClayButton, ClayCard, IconButton, Squish } from "../../components/ui/Clay";
import { ChoiceChips } from "../../components/ui/Form";
import { T } from "../../components/ui/T";
import { GrowthChart } from "../../components/GrowthChart";
import { EmptyHint } from "../../components/MomentBits";

type Metric = "height" | "weight" | "head";

const METRICS: Record<Metric, { label: string; long: string; pick: (g: GrowthEntry) => number | undefined; format: (v: number) => string; color: string }> = {
  height: { label: "Größe", long: "Größe", pick: (g) => g.heightCm, format: formatCm, color: colors.honey },
  weight: { label: "Gewicht", long: "Gewicht", pick: (g) => g.weightGrams, format: formatWeight, color: colors.sky },
  head: { label: "Kopf", long: "Kopfumfang", pick: (g) => g.headCm, format: formatCm, color: colors.lilac },
};

const MAX_WIDTH = 560;

export default function GrowthScreen() {
  const { active } = useFamily();
  const bottomSpace = useTabBarSpace();

  if (!active) {
    return (
      <Screen bottomSpace={bottomSpace}>
        <Header title="Wachstum" back={false} />
        <T variant="body">Legt zuerst ein Kind an.</T>
      </Screen>
    );
  }

  if (active.kind === "pregnancy") {
    const { week } = pregnancyWeek(active.profile.dueDate);
    return (
      <Screen bottomSpace={bottomSpace}>
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

  return <Growth child={active} profile={active.profile} bottomSpace={bottomSpace} />;
}

function Growth({ child, profile, bottomSpace }: { child: Child; profile: BabyProfile; bottomSpace: number }) {
  const { moments, growth } = useChildData(child.id);
  const { width } = useWindowDimensions();
  const [metric, setMetric] = useState<Metric>("height");
  const values = latestValues(growth);
  const available = (Object.keys(METRICS) as Metric[]).filter((k) => growth.some((g) => METRICS[k].pick(g)));
  const current = available.includes(metric) ? metric : available[0] ?? "height";
  const m = METRICS[current];
  const points = growth.filter((g) => m.pick(g)).map((g) => ({ date: g.measuredOn, value: m.pick(g)! }));
  const chartWidth = Math.min(width, MAX_WIDTH) - space.gutter * 2 - space.md * 2;
  const newestFirst = [...growth].reverse();
  const addMeasurement = () => router.push(`/messung?child=${child.id}`);

  const delta = (k: Metric) => {
    const list = growth.filter((g) => METRICS[k].pick(g));
    if (list.length < 2) return null;
    const a = METRICS[k].pick(list[list.length - 2])!;
    const b = METRICS[k].pick(list[list.length - 1])!;
    const d = b - a;
    if (d <= 0) return null;
    return `+${METRICS[k].format(d)} seit ${formatDateShort(list[list.length - 2].measuredOn)}`;
  };

  const note = (k: Metric, v?: { on: string }) => delta(k) ?? (v ? formatDateShort(v.on) : "noch nicht gemessen");

  const summary = (() => {
    if (points.length === 0) return undefined;
    const last = points[points.length - 1];
    const d = delta(current);
    return `${m.long}: zuletzt ${m.format(last.value)} am ${formatDateShort(last.date)}${d ? `, ${d}` : ""}. ${points.length} Messungen.`;
  })();

  return (
    <Screen bottomSpace={bottomSpace} blobs="cool" contentStyle={styles.content}>
      <Header
        title={`${child.name} wächst`}
        subtitle={ageText(profile.birthDate)}
        back={false}
        right={<IconButton icon="add" label="Neu messen" background={solid(child.color)} color={colors.onAccent} onPress={addMeasurement} />}
      />

      {growth.length === 0 ? (
        <ClayCard>
          <EmptyHint
            emoji="📏"
            title="Noch keine Messung"
            text="Tragt Größe, Gewicht oder Kopfumfang ein — z. B. aus dem gelben U-Heft. Jede Messung erscheint auch im Zeitstrahl."
          />
          <ClayButton label="Erste Messung eintragen" icon="add" color={child.color} onPress={addMeasurement} />
        </ClayCard>
      ) : (
        <View style={styles.sections}>
          <View style={styles.grid}>
            <View style={styles.tileRow}>
              <ValueTile label="Größe" color={METRICS.height.color} value={values.height ? formatCm(values.height.value) : "–"} note={note("height", values.height)} />
              <ValueTile label="Gewicht" color={METRICS.weight.color} value={values.weight ? formatWeight(values.weight.value) : "–"} note={note("weight", values.weight)} />
            </View>
            {values.head && (
              <ValueTile label="Kopfumfang" color={METRICS.head.color} value={formatCm(values.head.value)} note={note("head", values.head)} wide />
            )}
          </View>

          <ClayCard>
            {available.length > 1 && (
              <View style={styles.chips}>
                <ChoiceChips
                  label="Messgröße"
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
                summary={summary}
                startLabel={formatDateShort(points[0].date)}
                endLabel={formatDateShort(points[points.length - 1].date)}
                moments={moments.map((mo) => ({ id: mo.id, date: mo.happenedOn, emoji: momentEmoji(mo), color: momentColor(mo), title: momentTitle(mo) }))}
                onMomentPress={(id) => router.push(`/moment/${id}?child=${child.id}`)}
              />
            ) : (
              <T variant="body">Ab der zweiten Messung zeigt sich hier {child.name}s Kurve.</T>
            )}
            <T variant="small" style={styles.chartNote}>
              Das ist ganz allein {child.name}s Kurve — jedes Kind wächst in seinem eigenen Tempo. Die Bläschen sind eure Momente.
            </T>
          </ClayCard>

          <View style={styles.list}>
            <T variant="h3" accessibilityRole="header">
              Alle Messungen
            </T>
            {newestFirst.map((g) => (
              <Squish
                key={g.id}
                onPress={() => router.push(`/messung?child=${child.id}&id=${g.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Messung vom ${formatDateShort(g.measuredOn)}: ${formatMeasurement(g)}. Bearbeiten`}
                style={styles.row}
              >
                <View style={styles.monthTag}>
                  <T variant="chip" color={solid(colors.honey)}>
                    {formatMonthTag(g.measuredOn)}
                  </T>
                </View>
                <View style={styles.rowText}>
                  <T variant="bodyStrong">{formatMeasurement(g)}</T>
                  <T variant="small">
                    {ageAtDate(profile.birthDate, g.measuredOn)}
                    {g.note ? ` · ${g.note}` : ""}
                  </T>
                </View>
                <Ionicons name="chevron-forward" size={size.icon.sm} color={colors.muted} />
              </Squish>
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

/** Einheitliche Wertekachel: weiß, farbiges Label, große Zahl, kleine Notiz */
function ValueTile({ label, value, note, color, wide }: { label: string; value: string; note: string; color: string; wide?: boolean }) {
  return (
    <ClayCard style={wide ? styles.tileWide : styles.tile}>
      <View style={wide ? styles.tileWideText : null}>
        <T variant="label" color={solid(color)}>
          {label}
        </T>
        {wide ? (
          <T variant="small" numberOfLines={2}>
            {note}
          </T>
        ) : null}
      </View>
      <T variant="stat" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={wide ? null : styles.tileValue}>
        {value}
      </T>
      {wide ? null : (
        <T variant="small" numberOfLines={2}>
          {note}
        </T>
      )}
    </ClayCard>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: MAX_WIDTH, width: "100%", alignSelf: "center" },
  sections: { gap: space.section },
  grid: { gap: space.sm },
  tileRow: { flexDirection: "row", gap: space.sm },
  tile: { flex: 1 },
  tileValue: { marginVertical: space.xxs },
  tileWide: { flexDirection: "row", alignItems: "center", gap: space.sm },
  tileWideText: { flex: 1, gap: space.xxs },
  chips: { marginBottom: space.md },
  chartNote: { marginTop: space.sm },
  list: { gap: space.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
  },
  rowText: { flex: 1 },
  monthTag: {
    width: size.buttonSm,
    height: size.buttonSm,
    borderRadius: radius.sm,
    backgroundColor: soft(colors.sun),
    alignItems: "center",
    justifyContent: "center",
  },
});
