// ─── Schwangerschaft anlegen oder bearbeiten ─────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { PregnancyProfile } from "../types";
import { useFamily } from "../utils/family";
import { deletePregnancy, newId, savePregnancy } from "../utils/storage";
import { pregnancyWeek, toISODate, todayISO } from "../utils/dates";
import { CHILD_COLORS, colors, emoji, radius, size, solid, space } from "../utils/theme";
import { Header, Screen } from "./ui/Screen";
import { ClayButton, ClayCard, Squish } from "./ui/Clay";
import { ColorPicker, DateField, Field, FieldLabel } from "./ui/Form";
import { T } from "./ui/T";
import { useUnsavedGuard } from "./ui/useUnsavedGuard";

/** "Speichern" oben rechts — in allen Formular-Modals gleich */
function SavePill({ onPress, color, disabled, loading }: { onPress: () => void; color: string; disabled?: boolean; loading?: boolean }) {
  return (
    <Squish
      onPress={onPress}
      disabled={disabled || loading}
      haptic
      accessibilityRole="button"
      accessibilityLabel="Speichern"
      style={[styles.savePill, { backgroundColor: disabled ? colors.line : solid(color) }]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onAccent} />
      ) : (
        <T variant="buttonSm" color={disabled ? colors.muted : colors.onAccent} numberOfLines={1}>
          Speichern
        </T>
      )}
    </Squish>
  );
}

export default function PregnancyForm({ editId }: { editId?: string }) {
  const { children, refresh } = useFamily();
  const existing = editId ? children.find((c) => c.id === editId && c.kind === "pregnancy") : undefined;
  const profile = existing?.kind === "pregnancy" ? existing.profile : undefined;

  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [dueDate, setDueDate] = useState(profile?.dueDate.slice(0, 10) ?? toISODate(new Date(Date.now() + 180 * 86400000)));
  const [color, setColor] = useState(profile?.avatarColor ?? "#8C6CD9");
  const [notes, setNotes] = useState(profile?.description ?? "");
  const [saving, setSaving] = useState(false);
  const { week, day } = pregnancyWeek(dueDate);

  // Schutz vor ungespeicherten Änderungen; nach Speichern/Löschen erst lösen, dann navigieren
  const current = JSON.stringify([nickname, dueDate, color, notes]);
  const initial = useRef(current).current;
  const [done, setDone] = useState(false);
  const afterDone = useRef<(() => void) | null>(null);
  function finish(go: () => void) {
    afterDone.current = go;
    setDone(true);
  }
  useEffect(() => {
    if (!done || !afterDone.current) return;
    const go = afterDone.current;
    afterDone.current = null;
    setTimeout(go, 0);
  }, [done]);
  useUnsavedGuard(!done && current !== initial);

  async function handleSave() {
    setSaving(true);
    try {
      const p: PregnancyProfile = {
        id: profile?.id ?? newId(),
        nickname: nickname.trim() || "Unser Baby",
        dueDate,
        avatarColor: color,
        createdAt: profile?.createdAt ?? new Date().toISOString(),
        description: notes.trim() || undefined,
      };
      await savePregnancy(p);
      await refresh(p.id);
      finish(() => router.back());
    } catch {
      setSaving(false);
      Alert.alert("Speichern hat nicht geklappt", "Bitte prüfe deine Verbindung und versuch es noch einmal.");
    }
  }

  function handleDelete() {
    if (!profile) return;
    Alert.alert("Schwangerschaft löschen?", "Das Profil und alle Momente darin werden dauerhaft gelöscht.", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Endgültig löschen",
        style: "destructive",
        onPress: async () => {
          await deletePregnancy(profile.id);
          // Erst den Schutz lösen, dann neu laden (das Formular verschwindet dabei) und zum Start
          finish(async () => {
            await refresh();
            router.navigate("/(tabs)/start");
          });
        },
      },
    ]);
  }

  return (
    <Screen keyboard blobs="none" contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Header
        title={profile ? "Schwangerschaft bearbeiten" : "Wir erwarten ein Baby"}
        backIcon="close"
        right={<SavePill onPress={handleSave} color={color} loading={saving} />}
      />

      {!profile && (
        <ClayCard color={colors.lilacSoft} style={styles.intro}>
          <Text style={emoji(44)} accessibilityElementsHidden importantForAccessibility="no">
            🤰
          </Text>
          <T variant="body" style={{ flex: 1 }}>
            Sammelt schon jetzt Momente: Ultraschallbilder, Bauchfotos, den ersten Tritt. Nach der Geburt wandert alles ins Tagebuch eures Kindes.
          </T>
        </ClayCard>
      )}

      <Field label="Spitzname" hint="Ihr könnt ihn später ändern." value={nickname} onChangeText={setNickname} placeholder="z. B. Erdnuss" maxLength={40} />

      <View style={styles.block}>
        <FieldLabel>Errechneter Geburtstermin</FieldLabel>
        <DateField
          value={dueDate}
          onChange={setDueDate}
          color={color}
          quick={false}
          minimumDate={new Date(Date.now() - 30 * 86400000)}
          maximumDate={new Date(Date.now() + 300 * 86400000)}
        />
        <T variant="small" style={{ marginTop: space.sm, paddingHorizontal: space.xxs }}>
          {dueDate >= todayISO() ? `Das ist heute SSW ${week}${day ? ` + ${day}` : ""}.` : "Der Termin liegt schon zurück."}
        </T>
      </View>

      <View style={styles.block}>
        <FieldLabel>Farbe</FieldLabel>
        <ColorPicker options={CHILD_COLORS} value={color} onChange={setColor} />
      </View>

      <Field label="Notizen" value={notes} onChangeText={setNotes} multiline placeholder="z. B. Termine, Wünsche für die Geburt, Namensideen" />

      {profile && (
        <ClayButton label="Schwangerschaft löschen" icon="trash-outline" variant="ghost" color={colors.danger} onPress={handleDelete} style={{ marginTop: space.xs }} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  savePill: {
    height: size.touch,
    minWidth: 104,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: { flexDirection: "row", alignItems: "center", gap: space.md, marginBottom: space.lg },
  block: { marginBottom: space.lg },
});
