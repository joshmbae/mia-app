// ─── Kind anlegen oder bearbeiten ────────────────────────────────────────────

import React, { useState } from "react";
import { Alert, Image, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BabyProfile } from "../types";
import { useFamily } from "../utils/family";
import { deleteBaby, deletePhotos, newId, saveBaby, saveGrowthEntry, uploadPhoto } from "../utils/storage";
import { usePhotoUrls } from "../utils/usePhotoUrls";
import { pickImages } from "../utils/pickImage";
import { parseISODate, todayISO } from "../utils/dates";
import { CHILD_COLORS, colors, fonts, tint, type } from "../utils/theme";
import { Header, Screen } from "./ui/Screen";
import { ClayButton, ClayCard, Squish } from "./ui/Clay";
import { ChoiceChips, ColorPicker, DateField, Field, FieldLabel } from "./ui/Form";

type Gender = NonNullable<BabyProfile["gender"]>;

function parseNumber(text: string): number | undefined {
  const n = Number(text.replace(/\s/g, "").replace(",", "."));
  return text.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function ChildForm({ editId }: { editId?: string }) {
  const { children, refresh } = useFamily();
  const existing = editId ? children.find((c) => c.id === editId && c.kind === "baby") : undefined;
  const profile = existing?.kind === "baby" ? existing.profile : undefined;

  const [name, setName] = useState(profile?.name ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birthDate.slice(0, 10) ?? todayISO());
  const [color, setColor] = useState(profile?.avatarColor ?? CHILD_COLORS[children.length % CHILD_COLORS.length]);
  const [gender, setGender] = useState<Gender | undefined>(profile?.gender);
  const [premature, setPremature] = useState(profile?.premature ?? false);
  const [dueDate, setDueDate] = useState(profile?.dueDate?.slice(0, 10) ?? todayISO());
  const [photo, setPhoto] = useState<string | undefined>(profile?.photoUri);
  const [notes, setNotes] = useState(profile?.description ?? "");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [head, setHead] = useState("");
  const [saving, setSaving] = useState(false);

  const urls = usePhotoUrls([photo]);
  const photoUrl = photo ? urls[photo] ?? (photo.startsWith("storage:") ? undefined : photo) : undefined;

  async function choosePhoto() {
    const [uri] = await pickImages({ square: true });
    if (uri) setPhoto(uri);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Wie heißt dein Kind?", "Bitte gib einen Namen oder Spitznamen ein.");
      return;
    }
    setSaving(true);
    try {
      const id = profile?.id ?? newId();
      const photoRef = photo ? await uploadPhoto(`${id}/profil`, photo) : undefined;
      const baby: BabyProfile = {
        ...(profile ?? {}),
        id,
        name: name.trim(),
        birthDate,
        avatarColor: color,
        createdAt: profile?.createdAt ?? new Date().toISOString(),
        gender,
        premature,
        dueDate: premature ? dueDate : undefined,
        photoUri: photoRef,
        description: notes.trim() || undefined,
      };
      await saveBaby(baby);
      if (profile?.photoUri && profile.photoUri !== photoRef) await deletePhotos([profile.photoUri]);
      if (!profile) {
        const h = parseNumber(height);
        const w = parseNumber(weight);
        const k = parseNumber(head);
        if (h || w || k) {
          await saveGrowthEntry({
            id: "birth",
            babyId: id,
            measuredOn: birthDate,
            heightCm: h,
            weightGrams: w ? Math.round(w > 100 ? w : w * 1000) : undefined,
            headCm: k,
            note: "Geburt",
            createdAt: new Date().toISOString(),
          });
        }
      }
      await refresh(id);
      router.back();
    } catch {
      setSaving(false);
      Alert.alert("Speichern hat nicht geklappt", "Bitte prüfe deine Verbindung und versuch es noch einmal.");
    }
  }

  function handleDelete() {
    if (!profile) return;
    Alert.alert(
      `${profile.name} löschen?`,
      "Das Profil, alle Momente, Fotos und Messungen werden dauerhaft gelöscht.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Endgültig löschen",
          style: "destructive",
          onPress: async () => {
            await deleteBaby(profile);
            await refresh();
            router.navigate("/(tabs)/start");
          },
        },
      ]
    );
  }

  return (
    <Screen keyboard bottomSpace={60} contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Header title={profile ? `${profile.name} bearbeiten` : "Kind anlegen"} backIcon="close" />

      {/* Foto */}
      <View style={styles.photoWrap}>
        <Squish onPress={choosePhoto} accessibilityRole="button" accessibilityLabel="Foto wählen" style={[styles.photo, { backgroundColor: tint(color, 0.22) }]}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photoImg} />
          ) : (
            <View style={[styles.photoImg, { backgroundColor: color, alignItems: "center", justifyContent: "center" }]}>
              <Text style={styles.initial}>{name.trim() ? name.trim().charAt(0).toUpperCase() : "?"}</Text>
            </View>
          )}
          <View style={[styles.camera, { backgroundColor: colors.sun }]}>
            <Ionicons name="camera" size={18} color={colors.ink} />
          </View>
        </Squish>
        {photo ? (
          <Squish onPress={() => setPhoto(undefined)} accessibilityRole="button" style={{ marginTop: 10 }}>
            <Text style={[type.small, { color: colors.danger }]}>Foto entfernen</Text>
          </Squish>
        ) : (
          <Text style={[type.small, { marginTop: 10 }]}>Tippe, um ein Foto zu wählen</Text>
        )}
      </View>

      <Field label="Name" value={name} onChangeText={setName} placeholder="z. B. Emil" autoCapitalize="words" maxLength={40} />

      <View style={styles.block}>
        <FieldLabel>Geburtstag</FieldLabel>
        <DateField value={birthDate} onChange={setBirthDate} color={color} quick={false} maximumDate={new Date()} />
      </View>

      <View style={styles.block}>
        <FieldLabel>Farbe</FieldLabel>
        <ColorPicker options={CHILD_COLORS} value={color} onChange={setColor} />
      </View>

      <View style={styles.block}>
        <FieldLabel hint="Freiwillig">Geschlecht</FieldLabel>
        <ChoiceChips<Gender>
          options={[
            { value: "female", label: "Mädchen" },
            { value: "male", label: "Junge" },
            { value: "other", label: "Divers" },
          ]}
          value={gender}
          onChange={(v) => setGender(gender === v ? undefined : v)}
          color={color}
        />
      </View>

      <ClayCard strength="soft" style={styles.block}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={type.bodyStrong}>Zu früh geboren</Text>
            <Text style={type.small}>Dann richten sich die Phasen nach dem errechneten Termin.</Text>
          </View>
          <Switch
            value={premature}
            onValueChange={setPremature}
            trackColor={{ true: color, false: colors.line }}
            thumbColor={colors.surface}
            accessibilityLabel="Zu früh geboren"
          />
        </View>
        {premature && (
          <View style={{ marginTop: 14 }}>
            <FieldLabel>Errechneter Termin</FieldLabel>
            <DateField value={dueDate} onChange={setDueDate} color={color} quick={false} minimumDate={parseISODate(birthDate)} />
          </View>
        )}
      </ClayCard>

      {!profile && (
        <View style={styles.block}>
          <FieldLabel hint="Freiwillig — wird die erste Messung im Zeitstrahl.">Bei der Geburt</FieldLabel>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="cm" value={height} onChangeText={setHeight} placeholder="52" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="kg" value={weight} onChangeText={setWeight} placeholder="3,4" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Kopf cm" value={head} onChangeText={setHead} placeholder="35" keyboardType="decimal-pad" />
            </View>
          </View>
        </View>
      )}

      <Field label="Notizen" hint="Was du festhalten möchtest — nur für euch." value={notes} onChangeText={setNotes} multiline placeholder="z. B. Lieblingslied, Spitznamen, Besonderheiten" />

      <ClayButton label={profile ? "Änderungen sichern" : `${name.trim() || "Kind"} anlegen`} icon="heart" color={color} loading={saving} onPress={handleSave} />
      {profile && <ClayButton label="Kind löschen" icon="trash-outline" variant="ghost" color={colors.danger} onPress={handleDelete} style={{ marginTop: 8 }} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoWrap: { alignItems: "center", marginBottom: 22 },
  photo: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 64,
    borderTopRightRadius: 76,
    borderBottomRightRadius: 63,
    borderBottomLeftRadius: 77,
  },
  photoImg: { width: 120, height: 120, borderTopLeftRadius: 60, borderTopRightRadius: 53, borderBottomRightRadius: 62, borderBottomLeftRadius: 55 },
  initial: { fontFamily: fonts.displayBold, fontSize: 52, color: colors.onAccent },
  camera: {
    position: "absolute",
    right: 2,
    bottom: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },
  block: { marginBottom: 20 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  row: { flexDirection: "row", gap: 10 },
});
