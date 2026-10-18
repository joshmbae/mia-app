// ─── Messung eintragen / bearbeiten ──────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { GrowthEntry } from "../types";
import { useChild } from "../utils/family";
import { deleteGrowthEntry, loadGrowth, newId, saveGrowthEntry } from "../utils/storage";
import { ageAtDate, parseISODate, todayISO } from "../utils/dates";
import { colors, fonts, type } from "../utils/theme";
import { Header, Screen } from "../components/ui/Screen";
import { ClayButton, ClayCard } from "../components/ui/Clay";
import { ChoiceChips, DateField, Field, FieldLabel } from "../components/ui/Form";

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
      }
      setLoaded(true);
    });
  }, [params.id, child?.id]);

  if (!child || child.kind !== "baby" || !loaded) {
    return (
      <Screen>
        <ActivityIndicator color={colors.coral} style={{ marginTop: 80 }} />
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
      Alert.alert("Was wurde gemessen?", "Trag mindestens Größe, Gewicht oder Kopfumfang ein.");
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
      router.back();
    } catch {
      setSaving(false);
      Alert.alert("Speichern hat nicht geklappt", "Bitte prüfe deine Verbindung und versuch es noch einmal.");
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
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen keyboard blobs="cool" bottomSpace={60}>
      <Header title={existing ? "Messung bearbeiten" : "Neu messen"} subtitle={child.name} backIcon="close" />

      <ClayCard color={colors.sunSoft} glow={colors.sun} style={styles.intro}>
        <Text style={{ fontSize: 36 }}>📏</Text>
        <Text style={[type.body, { flex: 1 }]}>
          Trag ein, was gemessen wurde — z. B. aus dem gelben U-Heft. Nicht alles muss ausgefüllt sein.
        </Text>
      </ClayCard>

      <View style={styles.section}>
        <FieldLabel>Wann?</FieldLabel>
        <DateField value={date} onChange={setDate} color={child.color} maximumDate={new Date()} minimumDate={parseISODate(birth)} />
        <Text style={styles.ageHint}>{child.name} {ageAtDate(birth, date)}</Text>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="Größe (cm)" value={height} onChangeText={setHeight} placeholder="74" keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Gewicht (kg)" value={weight} onChangeText={setWeight} placeholder="8,9" keyboardType="decimal-pad" />
        </View>
      </View>
      <Field label="Kopfumfang (cm)" value={head} onChangeText={setHead} placeholder="45" keyboardType="decimal-pad" />

      <FieldLabel>Wo gemessen?</FieldLabel>
      <ChoiceChips
        options={PLACES.map((p) => ({ value: p, label: p }))}
        value={(PLACES as readonly string[]).includes(note) ? (note as (typeof PLACES)[number]) : undefined}
        onChange={(v) => setNote(note === v ? "" : v)}
        color={child.color}
      />
      <View style={{ height: 14 }} />
      <Field label="Notiz" value={note} onChangeText={setNote} placeholder="z. B. U5 bei Dr. Sommer" />

      <ClayButton label="Messung sichern" icon="checkmark" color={child.color} loading={saving} onPress={handleSave} style={{ marginTop: 8 }} />
      {existing && <ClayButton label="Messung löschen" icon="trash-outline" variant="ghost" color={colors.danger} onPress={handleDelete} style={{ marginTop: 8 }} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: "row", alignItems: "center", gap: 14 },
  section: { marginTop: 22, marginBottom: 18 },
  ageHint: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft, marginTop: 12, paddingHorizontal: 4 },
  row: { flexDirection: "row", gap: 12 },
});
