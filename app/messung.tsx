// ─── Messung eintragen / bearbeiten ──────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { GrowthEntry } from "../types";
import { useChild } from "../utils/family";
import { deleteGrowthEntry, loadGrowth, newId, saveGrowthEntry } from "../utils/storage";
import { ageAtDate, parseISODate, todayISO } from "../utils/dates";
import { colors, emoji, radius, size, soft, solid, space } from "../utils/theme";
import { announce } from "../utils/a11y";
import { Header, Screen } from "../components/ui/Screen";
import { ClayButton, ClayCard, Squish } from "../components/ui/Clay";
import { ChoiceChips, DateField, Field, FieldLabel } from "../components/ui/Form";
import { T } from "../components/ui/T";
import { useUnsavedGuard } from "../components/ui/useUnsavedGuard";

const PLACES = ["U-Untersuchung", "Hebamme", "Zuhause"] as const;

function parseNumber(text: string): number | undefined {
  const cleaned = text.replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

function toText(n?: number): string {
  return n === undefined ? "" : n.toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

export default function MeasurementScreen() {
  const params = useLocalSearchParams<{ child?: string; id?: string }>();
  const child = useChild(params.child);
  const [existing, setExisting] = useState<GrowthEntry | null>(null);
  const [date, setDate] = useState(todayISO());
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [head, setHead] = useState("");
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(!params.id);
  const [saving, setSaving] = useState(false);
  // Nach Speichern/Löschen: Schutz aus, dann im nächsten Render schließen
  const [done, setDone] = useState(false);
  const initial = useRef({ date: todayISO(), height: "", weight: "", head: "", note: "" });

  const changed =
    date !== initial.current.date ||
    height !== initial.current.height ||
    weight !== initial.current.weight ||
    head !== initial.current.head ||
    note !== initial.current.note;
  const dirty = loaded && changed && !done;
  useUnsavedGuard(dirty);
  const hasValue = [height, weight, head].some((v) => v.trim() !== "");

  useEffect(() => {
    if (done) router.back();
  }, [done]);

  useEffect(() => {
    if (!params.id || !child) return;
    loadGrowth(child.id).then((list) => {
      const g = list.find((e) => e.id === params.id);
      if (g) {
        setExisting(g);
        setDate(g.measuredOn);
        setHeight(toText(g.heightCm));
        setWeight(g.weightGrams ? toText(g.weightGrams / 1000) : "");
        setHead(toText(g.headCm));
        setNote(g.note ?? "");
        initial.current = {
          date: g.measuredOn,
          height: toText(g.heightCm),
          weight: g.weightGrams ? toText(g.weightGrams / 1000) : "",
          head: toText(g.headCm),
          note: g.note ?? "",
        };
      }
      setLoaded(true);
    });
  }, [params.id, child?.id]);

  if (!child || child.kind !== "baby" || !loaded) {
    return (
      <Screen>
        <ActivityIndicator color={solid(colors.coral)} style={styles.loading} />
      </Screen>
    );
  }
  const birth = child.profile.birthDate;

  async function handleSave() {
    if (!child) return;
    const h = parseNumber(height);
    const wRaw = parseNumber(weight);
    const k = parseNumber(head);
    if ([h, wRaw, k].some((v) => Number.isNaN(v))) {
      Alert.alert("Das sieht nicht nach einer Zahl aus", "Bitte nur Zahlen eingeben, z. B. 74 oder 8,9.");
      return;
    }
    if (h === undefined && wRaw === undefined && k === undefined) {
      Alert.alert("Was wurde gemessen?", "Tragt mindestens Größe, Gewicht oder Kopfumfang ein.");
      return;
    }
    // Gewicht in kg; größere Zahlen sind sehr wahrscheinlich Gramm
    const grams = wRaw === undefined ? undefined : Math.round(wRaw > 100 ? wRaw : wRaw * 1000);
    const problems: string[] = [];
    if (h !== undefined && (h < 30 || h > 200)) problems.push("Größe zwischen 30 und 200 cm");
    if (grams !== undefined && (grams < 400 || grams > 90000)) problems.push("Gewicht zwischen 0,4 und 90 kg");
    if (k !== undefined && (k < 20 || k > 70)) problems.push("Kopfumfang zwischen 20 und 70 cm");
    if (problems.length) {
      Alert.alert("Bitte kurz prüfen", `Erwartet wird: ${problems.join(", ")}.`);
      return;
    }
    setSaving(true);
    try {
      await saveGrowthEntry({
        id: existing?.id ?? newId(),
        babyId: child.id,
        measuredOn: date,
        heightCm: h,
        weightGrams: grams,
        headCm: k,
        note: note.trim() || undefined,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
      announce("Messung gespeichert");
      setDone(true);
    } catch {
      setSaving(false);
      Alert.alert("Speichern hat nicht geklappt", "Bitte prüft eure Verbindung und versucht es noch einmal.");
    }
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert("Messung löschen?", undefined, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          await deleteGrowthEntry(existing);
          announce("Messung gelöscht");
          setDone(true);
        },
      },
    ]);
  }

  const canSave = hasValue && !saving;
  const saveButton = (
    <Squish
      onPress={handleSave}
      disabled={!canSave}
      haptic
      accessibilityRole="button"
      accessibilityLabel="Speichern"
      style={[styles.save, { backgroundColor: hasValue ? solid(child.color) : colors.line }]}
    >
      {saving ? (
        <ActivityIndicator color={colors.onAccent} />
      ) : (
        <T variant="buttonSm" color={hasValue ? colors.onAccent : colors.muted}>
          Speichern
        </T>
      )}
    </Squish>
  );

  return (
    <Screen keyboard blobs="none" bottomSpace={space.xxl}>
      <Header title={existing ? "Messung bearbeiten" : "Neu messen"} subtitle={child.name} backIcon="close" right={saveButton} />

      <ClayCard color={soft(colors.sun)} lift="flat" style={styles.intro}>
        <Text style={emoji(32)} accessibilityElementsHidden importantForAccessibility="no">
          📏
        </Text>
        <T variant="body" style={styles.flex}>
          Tragt ein, was gemessen wurde — z. B. aus dem gelben U-Heft. Nicht alles muss ausgefüllt sein.
        </T>
      </ClayCard>

      <View style={styles.section}>
        <FieldLabel>Wann?</FieldLabel>
        <DateField value={date} onChange={setDate} color={child.color} maximumDate={new Date()} minimumDate={parseISODate(birth)} />
        <T variant="small" style={styles.ageHint}>
          {child.name} {ageAtDate(birth, date)}
        </T>
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Field label="Größe" unit="cm" value={height} onChangeText={setHeight} placeholder="–" keyboardType="decimal-pad" />
        </View>
        <View style={styles.flex}>
          <Field label="Gewicht" unit="kg" value={weight} onChangeText={setWeight} placeholder="–" keyboardType="decimal-pad" />
        </View>
      </View>
      <Field label="Kopfumfang" unit="cm" value={head} onChangeText={setHead} placeholder="–" keyboardType="decimal-pad" />

      <View style={styles.places}>
        <FieldLabel>Wo gemessen?</FieldLabel>
        <ChoiceChips
          label="Wo gemessen?"
          options={PLACES.map((p) => ({ value: p, label: p }))}
          value={(PLACES as readonly string[]).includes(note) ? (note as (typeof PLACES)[number]) : undefined}
          onChange={(v) => setNote(note === v ? "" : v)}
          color={child.color}
        />
      </View>
      <Field label="Notiz" value={note} onChangeText={setNote} placeholder="z. B. U5" />

      {existing && <ClayButton label="Messung löschen" icon="trash-outline" variant="ghost" color={colors.danger} onPress={handleDelete} style={styles.delete} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space.xxl * 2 },
  flex: { flex: 1 },
  intro: { flexDirection: "row", alignItems: "center", gap: space.sm },
  section: { marginTop: space.lg, marginBottom: space.lg },
  ageHint: { marginTop: space.sm, paddingHorizontal: space.xxs },
  row: { flexDirection: "row", gap: space.sm },
  places: { marginBottom: space.md + 4 },
  delete: { marginTop: space.lg },
  save: {
    minWidth: 112,
    height: size.touch,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
