// ─── Unser Baby ist da! — aus der Schwangerschaft wird ein Kind ──────────────

import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BabyProfile, Child } from "../../types";
import { useChild, useFamily } from "../../utils/family";
import { convertPregnancyToBaby, newId, uploadPhoto } from "../../utils/storage";
import { daysBetween, todayISO } from "../../utils/dates";
import { pickImages } from "../../utils/pickImage";
import { celebrate } from "../../utils/haptics";
import { announce } from "../../utils/a11y";
import { CHILD_COLORS, colors, ctaShadow, emoji, radius, size, solid, space } from "../../utils/theme";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayButton, ClayCard, Squish } from "../../components/ui/Clay";
import { ChoiceChips, ColorPicker, DateField, Field, FieldLabel } from "../../components/ui/Form";
import { T } from "../../components/ui/T";
import { useUnsavedGuard } from "../../components/ui/useUnsavedGuard";
import { Confetti } from "../../components/Confetti";

type Gender = NonNullable<BabyProfile["gender"]>;

function parseNumber(text: string): number | undefined {
  const n = Number(text.replace(/\s/g, "").replace(",", "."));
  return text.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function BirthScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const pregnancy = useChild(params.id);
  if (!pregnancy || pregnancy.kind !== "pregnancy") return <Screen blobs="none">{null}</Screen>;
  // Erst rendern, wenn die Schwangerschaft geladen ist — sie liefert die Startwerte
  return <BirthForm key={pregnancy.id} pregnancy={pregnancy} />;
}

function BirthForm({ pregnancy }: { pregnancy: Child }) {
  const { refresh } = useFamily();
  const due = pregnancy.kind === "pregnancy" ? pregnancy.profile.dueDate.slice(0, 10) : todayISO();
  const initialDate = due < todayISO() ? due : todayISO();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState(initialDate);
  const [color, setColor] = useState(pregnancy.color);
  const [gender, setGender] = useState<Gender | undefined>();
  const [photo, setPhoto] = useState<string | undefined>();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [head, setHead] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const earlyDays = daysBetween(birthDate, due);
  const premature = earlyDays >= 21; // vor SSW 37
  const canSave = !!name.trim() && !saving;

  const changed =
    !!name.trim() ||
    birthDate !== initialDate ||
    color !== pregnancy.color ||
    !!gender ||
    !!photo ||
    !!height.trim() ||
    !!weight.trim() ||
    !!head.trim();
  useUnsavedGuard(changed && !saved);

  async function handleSave() {
    if (pregnancy.kind !== "pregnancy" || !canSave) return;
    setSaving(true);
    try {
      const id = newId();
      const baby: BabyProfile = {
        id,
        name: name.trim(),
        birthDate,
        avatarColor: color,
        createdAt: new Date().toISOString(),
        gender,
        premature,
        dueDate: due,
        photoUri: photo ? await uploadPhoto(`${id}/profil`, photo) : undefined,
        description: pregnancy.profile.description,
      };
      const w = parseNumber(weight);
      await convertPregnancyToBaby(pregnancy.id, baby, {
        heightCm: parseNumber(height),
        weightGrams: w ? Math.round(w > 100 ? w : w * 1000) : undefined,
        headCm: parseNumber(head),
      });
      // Schutz vor ungespeicherten Änderungen aufheben, bevor navigiert wird
      setSaved(true);
      celebrate();
      announce(`Willkommen, ${baby.name}!`);
      await refresh(id);
      setTimeout(() => router.navigate("/(tabs)/start"), 0);
    } catch {
      setSaving(false);
      Alert.alert("Speichern hat nicht geklappt", "Bitte prüft eure Verbindung und versucht es noch einmal.");
    }
  }

  const fill = solid(color);

  return (
    <View style={styles.flex}>
      <Screen keyboard blobs="none" contentStyle={styles.content}>
        <Header
          title="Baby ist da!"
          backIcon="close"
          right={
            <Squish
              onPress={handleSave}
              disabled={!canSave}
              haptic
              accessibilityRole="button"
              accessibilityLabel={name.trim() ? `${name.trim()} begrüßen` : "Begrüßen"}
              accessibilityHint={name.trim() ? undefined : "Zuerst einen Namen eingeben"}
              style={[styles.savePill, { backgroundColor: canSave || saving ? fill : colors.line }, canSave ? ctaShadow(color) : null]}
            >
              {saving ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <T variant="buttonSm" color={canSave ? colors.onAccent : colors.muted}>
                  Begrüßen
                </T>
              )}
            </Squish>
          }
        />

        <ClayCard color={colors.sunSoft} style={styles.intro}>
          <Text style={emoji(44)} accessibilityElementsHidden importantForAccessibility="no">
            🎉
          </Text>
          <T variant="body" style={styles.flex}>
            Herzlichen Glückwunsch! Alle Momente aus der Schwangerschaft wandern mit ins Tagebuch — als Kapitel „Bevor du da warst“.
          </T>
        </ClayCard>

        <Field label="Name" value={name} onChangeText={setName} placeholder="Wie heißt euer Baby?" autoCapitalize="words" maxLength={40} />

        <View style={styles.block}>
          <FieldLabel>Geboren am</FieldLabel>
          <DateField value={birthDate} onChange={setBirthDate} color={color} maximumDate={new Date()} />
          {premature && (
            <T variant="small" style={styles.note}>
              {earlyDays} Tage vor dem Termin — wir rechnen die Phasen nach dem korrigierten Alter.
            </T>
          )}
        </View>

        <View style={styles.block}>
          <FieldLabel hint="Freiwillig — wird die erste Messung.">Bei der Geburt</FieldLabel>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Field label="Länge" unit="cm" value={height} onChangeText={setHeight} placeholder="–" keyboardType="decimal-pad" />
            </View>
            <View style={styles.flex}>
              <Field label="Gewicht" unit="kg" value={weight} onChangeText={setWeight} placeholder="–" keyboardType="decimal-pad" />
            </View>
            <View style={styles.flex}>
              <Field label="Kopf" unit="cm" value={head} onChangeText={setHead} placeholder="–" keyboardType="decimal-pad" />
            </View>
          </View>
        </View>

        <View style={styles.block}>
          <FieldLabel hint="Freiwillig">Geschlecht</FieldLabel>
          <ChoiceChips<Gender>
            label="Geschlecht"
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

        <View style={styles.block}>
          <FieldLabel>Farbe</FieldLabel>
          <ColorPicker options={CHILD_COLORS} value={color} onChange={setColor} />
        </View>

        <ClayButton
          label={photo ? "Foto ausgewählt" : "Erstes Foto wählen"}
          icon={photo ? "checkmark-circle" : "camera"}
          variant="soft"
          color={color}
          onPress={async () => {
            const [uri] = await pickImages({ square: true });
            if (uri) setPhoto(uri);
          }}
        />
      </Screen>
      <Confetti />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { maxWidth: 560, width: "100%", alignSelf: "center" },
  savePill: {
    minHeight: size.touch,
    minWidth: 96,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: { flexDirection: "row", alignItems: "center", gap: space.md, marginBottom: space.lg },
  block: { marginBottom: space.lg },
  note: { marginTop: space.xs, paddingHorizontal: space.xxs },
  row: { flexDirection: "row", gap: space.xs },
});
