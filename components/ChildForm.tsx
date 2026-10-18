// ─── Kind anlegen oder bearbeiten ────────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Switch, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BabyProfile } from "../types";
import { useFamily } from "../utils/family";
import { deleteBaby, deletePhotos, newId, saveBaby, saveGrowthEntry, uploadPhoto } from "../utils/storage";
import { usePhotoUrls } from "../utils/usePhotoUrls";
import { pickImages } from "../utils/pickImage";
import { parseISODate, todayISO } from "../utils/dates";
import { CHILD_COLORS, colors, radius, size, soft, solid, space } from "../utils/theme";
import { Header, Screen } from "./ui/Screen";
import { ClayButton, ClayCard, Squish } from "./ui/Clay";
import { ChoiceChips, ColorPicker, DateField, Field, FieldLabel } from "./ui/Form";
import { T } from "./ui/T";
import { useUnsavedGuard } from "./ui/useUnsavedGuard";

type Gender = NonNullable<BabyProfile["gender"]>;

function parseNumber(text: string): number | undefined {
  const n = Number(text.replace(/\s/g, "").replace(",", "."));
  return text.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
}

/** "Speichern" oben rechts — in allen Formular-Modals gleich */
function SavePill({ onPress, color, disabled, loading, hint }: { onPress: () => void; color: string; disabled?: boolean; loading?: boolean; hint?: string }) {
  return (
    <Squish
      onPress={onPress}
      disabled={disabled || loading}
      haptic
      accessibilityRole="button"
      accessibilityLabel="Speichern"
      accessibilityHint={disabled ? hint : undefined}
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

  // Schutz vor ungespeicherten Änderungen; nach Speichern/Löschen erst lösen, dann navigieren
  const current = JSON.stringify([name, birthDate, color, gender ?? "", premature, dueDate, photo ?? "", notes, height, weight, head]);
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
  const valid = !!name.trim();

  const urls = usePhotoUrls([photo]);
  const photoUrl = photo ? urls[photo] ?? (photo.startsWith("storage:") ? undefined : photo) : undefined;

  async function choosePhoto() {
    const [uri] = await pickImages({ square: true });
    if (uri) setPhoto(uri);
  }

  async function handleSave() {
    if (!valid) return;
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
      finish(() => router.back());
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
            // Erst den Schutz lösen, dann neu laden (das Formular verschwindet dabei) und zum Start
            finish(async () => {
              await refresh();
              router.navigate("/(tabs)/start");
            });
          },
        },
      ]
    );
  }

  return (
    <Screen keyboard blobs="none" contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <Header
        title={profile ? `${profile.name} bearbeiten` : "Kind anlegen"}
        backIcon="close"
        right={<SavePill onPress={handleSave} color={color} disabled={!valid} loading={saving} hint="Gebt zuerst einen Namen ein." />}
      />

      {/* Foto */}
      <View style={styles.photoWrap}>
        <Squish onPress={choosePhoto} accessibilityRole="button" accessibilityLabel="Foto wählen" style={[styles.photo, { backgroundColor: soft(color) }]}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photoImg} accessibilityIgnoresInvertColors />
          ) : (
            <View style={[styles.photoImg, { backgroundColor: solid(color), alignItems: "center", justifyContent: "center" }]}>
              <T variant="hero" color={colors.onAccent}>
                {name.trim() ? name.trim().charAt(0).toUpperCase() : "?"}
              </T>
            </View>
          )}
          <View style={[styles.camera, { backgroundColor: colors.sun }]}>
            <Ionicons name="camera" size={size.icon.sm} color={colors.ink} />
          </View>
        </Squish>
        {photo ? (
          <Squish onPress={() => setPhoto(undefined)} accessibilityRole="button" accessibilityLabel="Foto entfernen" style={styles.photoAction}>
            <T variant="small" color={colors.danger}>
              Foto entfernen
            </T>
          </Squish>
        ) : (
          <View style={styles.photoAction}>
            <T variant="small">Tippt, um ein Foto zu wählen</T>
          </View>
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
          label="Geschlecht"
        />
      </View>

      <ClayCard style={styles.block}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <T variant="bodyStrong">Zu früh geboren</T>
            <T variant="small">Dann richten sich die Phasen nach dem errechneten Termin.</T>
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
          <View style={{ marginTop: space.md }}>
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
              <Field label="Größe" unit="cm" value={height} onChangeText={setHeight} placeholder="–" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Gewicht" unit="kg" value={weight} onChangeText={setWeight} placeholder="–" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Kopf" unit="cm" value={head} onChangeText={setHead} placeholder="–" keyboardType="decimal-pad" />
            </View>
          </View>
        </View>
      )}

      <Field label="Notizen" hint="Was ihr festhalten möchtet — nur für euch." value={notes} onChangeText={setNotes} multiline placeholder="z. B. Lieblingslied, Spitznamen, Besonderheiten" />

      {profile && <ClayButton label="Kind löschen" icon="trash-outline" variant="ghost" color={colors.danger} onPress={handleDelete} style={{ marginTop: space.xs }} />}
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
  photoWrap: { alignItems: "center", marginBottom: space.lg },
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
  camera: {
    position: "absolute",
    right: space.xxs / 2,
    bottom: space.xxs + 2,
    width: size.chip,
    height: size.chip,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },
  photoAction: { minHeight: size.touch, justifyContent: "center", paddingHorizontal: space.sm, marginTop: space.xxs },
  block: { marginBottom: space.lg },
  switchRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  row: { flexDirection: "row", gap: space.sm },
});
