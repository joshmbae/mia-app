// ─── Schwangerschaft anlegen oder bearbeiten ─────────────────────────────────

import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { PregnancyProfile } from "../types";
import { useFamily } from "../utils/family";
import { deletePregnancy, newId, savePregnancy } from "../utils/storage";
import { pregnancyWeek, toISODate, todayISO } from "../utils/dates";
import { CHILD_COLORS, colors, type } from "../utils/theme";
import { Header, Screen } from "./ui/Screen";
import { ClayButton, ClayCard } from "./ui/Clay";
import { ColorPicker, DateField, Field, FieldLabel } from "./ui/Form";

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
      router.back();
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
          await refresh();
          router.navigate("/(tabs)/start");
        },
      },
    ]);
  }

  return (
    <Screen keyboard bottomSpace={60} contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Header title={profile ? "Schwangerschaft bearbeiten" : "Wir erwarten ein Baby"} backIcon="close" />

      <ClayCard color={colors.lilacSoft} glow={colors.lilac} style={styles.intro}>
        <Text style={{ fontSize: 40 }}>🤰</Text>
        <Text style={[type.body, { flex: 1 }]}>
          Schon jetzt Momente sammeln: Ultraschallbilder, Bauchfotos, der erste Tritt. Nach der Geburt wandert alles ins Tagebuch eures Kindes.
        </Text>
      </ClayCard>

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
        <Text style={[type.small, { marginTop: 10, paddingHorizontal: 4 }]}>
          {dueDate >= todayISO() ? `Das ist heute SSW ${week}${day ? ` + ${day}` : ""}.` : "Der Termin liegt schon zurück."}
        </Text>
      </View>

      <View style={styles.block}>
        <FieldLabel>Farbe</FieldLabel>
        <ColorPicker options={CHILD_COLORS} value={color} onChange={setColor} />
      </View>

      <Field label="Notizen" value={notes} onChangeText={setNotes} multiline placeholder="z. B. Termine, Wünsche für die Geburt, Namensideen" />

      <ClayButton label={profile ? "Änderungen sichern" : "Los geht's"} icon="heart" color={color} loading={saving} onPress={handleSave} />
      {profile && <ClayButton label="Schwangerschaft löschen" icon="trash-outline" variant="ghost" color={colors.danger} onPress={handleDelete} style={{ marginTop: 8 }} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  block: { marginBottom: 20 },
});
