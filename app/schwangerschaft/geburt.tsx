// ─── Unser Baby ist da! — aus der Schwangerschaft wird ein Kind ──────────────

import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BabyProfile, Child } from "../../types";
import { useChild, useFamily } from "../../utils/family";
import { convertPregnancyToBaby, newId, uploadPhoto } from "../../utils/storage";
import { daysBetween, todayISO } from "../../utils/dates";
import { pickImages } from "../../utils/pickImage";
import { celebrate } from "../../utils/haptics";
import { CHILD_COLORS, colors, type } from "../../utils/theme";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayButton, ClayCard } from "../../components/ui/Clay";
import { ChoiceChips, ColorPicker, DateField, Field, FieldLabel } from "../../components/ui/Form";
import { Confetti } from "../../components/Confetti";

type Gender = NonNullable<BabyProfile["gender"]>;

function parseNumber(text: string): number | undefined {
  const n = Number(text.replace(/\s/g, "").replace(",", "."));
  return text.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function BirthScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const pregnancy = useChild(params.id);
  if (!pregnancy || pregnancy.kind !== "pregnancy") return <Screen>{null}</Screen>;
  // Erst rendern, wenn die Schwangerschaft geladen ist — sie liefert die Startwerte
  return <BirthForm key={pregnancy.id} pregnancy={pregnancy} />;
}

function BirthForm({ pregnancy }: { pregnancy: Child }) {
  const { refresh } = useFamily();
  const due = pregnancy.kind === "pregnancy" ? pregnancy.profile.dueDate.slice(0, 10) : todayISO();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState(due < todayISO() ? due : todayISO());
  const [color, setColor] = useState(pregnancy.color);
  const [gender, setGender] = useState<Gender | undefined>();
  const [photo, setPhoto] = useState<string | undefined>();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [head, setHead] = useState("");
  const [saving, setSaving] = useState(false);
  const [party] = useState(true);

  const earlyDays = daysBetween(birthDate, due);
  const premature = earlyDays >= 21; // vor SSW 37

  async function handleSave() {
    if (pregnancy.kind !== "pregnancy") return;
    if (!name.trim()) {
      Alert.alert("Wie heißt euer Baby?", "Bitte gebt einen Namen ein.");
      return;
    }
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
      celebrate();
      await refresh(id);
      router.navigate("/(tabs)/start");
    } catch {
      setSaving(false);
      Alert.alert("Speichern hat nicht geklappt", "Bitte prüfe deine Verbindung und versuch es noch einmal.");
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen keyboard bottomSpace={60} contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <Header title="Baby ist da!" backIcon="close" />

        <ClayCard color={colors.sunSoft} glow={colors.sun} style={styles.intro}>
          <Text style={{ fontSize: 46 }}>🎉</Text>
          <Text style={[type.body, { flex: 1 }]}>
            Herzlichen Glückwunsch! Alle Momente aus der Schwangerschaft wandern mit ins Tagebuch — als Kapitel „Bevor du da warst“.
          </Text>
        </ClayCard>

        <Field label="Name" value={name} onChangeText={setName} placeholder="Wie heißt euer Baby?" autoCapitalize="words" maxLength={40} />

        <View style={styles.block}>
          <FieldLabel>Geboren am</FieldLabel>
          <DateField value={birthDate} onChange={setBirthDate} color={color} maximumDate={new Date()} />
          {premature && (
            <Text style={[type.small, { marginTop: 10, paddingHorizontal: 4 }]}>
              {earlyDays} Tage vor dem Termin — wir rechnen die Phasen nach dem korrigierten Alter.
            </Text>
          )}
        </View>

        <View style={styles.block}>
          <FieldLabel hint="Freiwillig — wird die erste Messung.">Bei der Geburt</FieldLabel>
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

        <View style={styles.block}>
          <FieldLabel>Farbe</FieldLabel>
          <ColorPicker options={CHILD_COLORS} value={color} onChange={setColor} />
        </View>

        <ClayButton
          label={photo ? "Foto ausgewählt ✓" : "Erstes Foto wählen"}
          icon="camera"
          variant="soft"
          color={color}
          onPress={async () => {
            const [uri] = await pickImages({ square: true });
            if (uri) setPhoto(uri);
          }}
          style={{ marginBottom: 14 }}
        />
        <ClayButton label={`${name.trim() || "Baby"} begrüßen`} icon="heart" color={color} loading={saving} onPress={handleSave} />
      </Screen>
      {party && <Confetti />}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  block: { marginBottom: 20 },
  row: { flexDirection: "row", gap: 10 },
});
