// ─── Moment festhalten / bearbeiten ──────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MomentEntry } from "../../types";
import { useChild } from "../../utils/family";
import { deleteMoment, deletePhotos, loadMoment, newId, resolvePhotoUrls, saveMoment, uploadPhoto } from "../../utils/storage";
import { CATEGORY_COLORS, CATEGORY_EMOJIS, CATEGORY_LABELS, CUSTOM_MOMENT_COLOR, CUSTOM_MOMENT_EMOJI } from "../../utils/milestoneData";
import { findMilestone } from "../../utils/moments";
import { ageAtDate, parseISODate, pregnancyWeek, todayISO } from "../../utils/dates";
import { pickImages } from "../../utils/pickImage";
import { colors, clay, fonts, radius, tint, type } from "../../utils/theme";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayButton, ClayCard, Squish } from "../../components/ui/Clay";
import { DateField, Field, FieldLabel } from "../../components/ui/Form";

const MAX_PHOTOS = 8;
const EMOJIS = ["🌟", "🎉", "🥰", "😂", "🎈", "🌸", "🍼", "🧸", "🐶", "🏖️", "🎄", "🎂", "🎵", "🚗", "🌞", "🌙", "🍓", "⚽", "📚", "💌"];

interface PhotoItem {
  ref?: string; // bereits gespeicherte Referenz
  uri: string;  // anzeigbare URI
}

export default function MomentEditorScreen() {
  const params = useLocalSearchParams<{ child?: string; entry?: string; milestone?: string; title?: string }>();
  const child = useChild(params.child);

  const [existing, setExisting] = useState<MomentEntry | null>(null);
  const [milestoneId, setMilestoneId] = useState<string | undefined>(params.milestone);
  const [title, setTitle] = useState(params.title ?? "");
  const [emoji, setEmoji] = useState(CUSTOM_MOMENT_EMOJI);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loaded, setLoaded] = useState(!params.entry);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.entry || !child) return;
    loadMoment(child.id, params.entry).then(async (entry) => {
      if (entry) {
        setExisting(entry);
        setMilestoneId(entry.milestoneId);
        setTitle(entry.title);
        if (entry.emoji) setEmoji(entry.emoji);
        setDate(entry.happenedOn);
        setNote(entry.note ?? "");
        const urls = await resolvePhotoUrls(entry.photos);
        setPhotos(entry.photos.map((ref) => ({ ref, uri: urls[ref] ?? ref })));
      }
      setLoaded(true);
    });
  }, [params.entry, child?.id]);

  if (!child || !loaded) {
    return (
      <Screen>
        <ActivityIndicator color={colors.coral} style={{ marginTop: 80 }} />
      </Screen>
    );
  }

  const milestone = findMilestone(milestoneId);
  const accent = milestone ? CATEGORY_COLORS[milestone.category] : CUSTOM_MOMENT_COLOR;
  const shownEmoji = milestone ? milestone.emoji : emoji;
  const ageHint =
    child.kind === "baby"
      ? ageAtDate(child.profile.birthDate, date)
      : `in SSW ${pregnancyWeek(child.profile.dueDate, date).week}`;
  const minDate =
    child.kind === "baby"
      ? new Date(parseISODate(child.profile.birthDate).getTime() - 300 * 86400000)
      : new Date(parseISODate(child.profile.dueDate).getTime() - 300 * 86400000);

  async function addPhotos() {
    const uris = await pickImages({ limit: MAX_PHOTOS - photos.length });
    if (uris.length) setPhotos((prev) => [...prev, ...uris.map((uri) => ({ uri }))].slice(0, MAX_PHOTOS));
  }

  async function handleSave() {
    if (!child) return;
    if (!milestone && !title.trim()) {
      Alert.alert("Wie heißt der Moment?", "Gib deinem Moment einen kurzen Titel.");
      return;
    }
    setSaving(true);
    try {
      const id = existing?.id ?? (milestone ? `ms_${milestone.id}` : newId());
      const refs = await Promise.all(photos.map((p) => p.ref ?? uploadPhoto(`${child.id}/${id}`, p.uri)));
      const entry: MomentEntry = {
        id,
        babyId: child.id,
        milestoneId: milestone?.id,
        title: milestone ? milestone.title : title.trim(),
        emoji: shownEmoji,
        happenedOn: date,
        note: note.trim() || undefined,
        photos: refs,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      await saveMoment(entry);
      await deletePhotos((existing?.photos ?? []).filter((r) => !refs.includes(r)));
      if (existing) router.back();
      else router.replace(`/moment/${id}?child=${child.id}&neu=1`);
    } catch {
      setSaving(false);
      Alert.alert("Speichern hat nicht geklappt", "Bitte prüfe deine Verbindung und versuch es noch einmal.");
    }
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert("Moment löschen?", "Text und Fotos dieses Moments werden entfernt.", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          await deleteMoment(existing);
          router.navigate("/(tabs)/zeitstrahl");
        },
      },
    ]);
  }

  return (
    <Screen keyboard bottomSpace={60}>
      <Header
        title={existing ? "Bearbeiten" : "Neuer Moment"}
        subtitle={child.name}
        backIcon="close"
        right={
          <Squish
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Sichern"
            style={[styles.save, { backgroundColor: accent }]}
          >
            {saving ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.saveText}>Sichern</Text>}
          </Squish>
        }
      />

      {/* Held */}
      <ClayCard color={tint(accent, 0.14)} glow={accent} style={styles.hero}>
        <View style={[styles.sticker, clay(accent, "normal")]}>
          <Text style={{ fontSize: 44 }}>{shownEmoji}</Text>
        </View>
        {milestone ? (
          <>
            <Text style={[type.label, { color: accent }]}>
              {CATEGORY_EMOJIS[milestone.category]}  {CATEGORY_LABELS[milestone.category]}
            </Text>
            <Text style={[type.h1, { textAlign: "center", marginTop: 4 }]}>{milestone.title}</Text>
          </>
        ) : (
          <>
            <Text style={[type.label, { color: accent }]}>Eigener Moment</Text>
            <Field
              value={title}
              onChangeText={setTitle}
              placeholder="Was ist passiert?"
              maxLength={80}
              style={styles.titleInput}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
              {EMOJIS.map((e) => (
                <Squish
                  key={e}
                  onPress={() => setEmoji(e)}
                  accessibilityRole="button"
                  accessibilityLabel={`Symbol ${e}`}
                  accessibilityState={{ selected: emoji === e }}
                  style={[styles.emojiChoice, emoji === e && { backgroundColor: colors.surface, borderColor: accent }]}
                >
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                </Squish>
              ))}
            </ScrollView>
          </>
        )}
      </ClayCard>

      {/* Datum */}
      <View style={styles.section}>
        <FieldLabel>Wann war es?</FieldLabel>
        <DateField value={date} onChange={setDate} color={accent} maximumDate={new Date()} minimumDate={minDate} />
        <Text style={styles.ageHint}>✨ {child.name} {ageHint}</Text>
      </View>

      {/* Fotos */}
      <View style={styles.section}>
        <FieldLabel hint={photos.length > 1 ? "Tippe ein Foto an, um es zum Titelbild zu machen." : undefined}>Fotos</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow} style={{ marginHorizontal: -20 }}>
          {photos.map((p, i) => (
            <View key={p.ref ?? p.uri} style={{ transform: [{ rotate: `${i % 2 === 0 ? -3 : 3}deg` }] }}>
              <Squish
                onPress={() => i > 0 && setPhotos((prev) => [prev[i], ...prev.filter((_, j) => j !== i)])}
                accessibilityRole="button"
                accessibilityLabel={i === 0 ? "Titelbild" : "Als Titelbild verwenden"}
                style={[styles.photo, clay(accent, "soft")]}
              >
                <Image source={{ uri: p.uri }} style={styles.photoImg} />
                {i === 0 && photos.length > 1 && (
                  <View style={[styles.coverBadge, { backgroundColor: accent }]}>
                    <Ionicons name="star" size={11} color={colors.onAccent} />
                  </View>
                )}
              </Squish>
              <Squish
                onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                accessibilityRole="button"
                accessibilityLabel="Foto entfernen"
                hitSlop={8}
                style={styles.remove}
              >
                <Ionicons name="close" size={14} color={colors.onAccent} />
              </Squish>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <Squish onPress={addPhotos} accessibilityRole="button" accessibilityLabel="Foto hinzufügen" style={[styles.addPhoto, { borderColor: tint(accent, 0.55) }]}>
              <Ionicons name="camera" size={28} color={accent} />
              <Text style={[styles.addPhotoText, { color: accent }]}>{photos.length ? "Noch eins" : "Foto"}</Text>
            </Squish>
          )}
        </ScrollView>
      </View>

      {/* Notiz */}
      <View style={styles.section}>
        <Field
          label="Deine Notiz"
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Wie war es? Was hat euch zum Lachen gebracht? Was willst du nie vergessen?"
        />
      </View>

      {milestone && (
        <ClayCard style={{ marginTop: 4 }}>
          <Text style={[type.h3, { marginBottom: 6 }]}>Über diesen Moment</Text>
          <Text style={type.body}>{milestone.description}</Text>
          {milestone.tip && (
            <View style={styles.tip}>
              <Text style={{ fontSize: 15 }}>💡</Text>
              <Text style={[type.body, { flex: 1, fontSize: 14 }]}>{milestone.tip}</Text>
            </View>
          )}
        </ClayCard>
      )}

      <ClayButton label={existing ? "Änderungen sichern" : "Moment sichern"} icon="heart" color={accent} loading={saving} onPress={handleSave} style={{ marginTop: 24 }} />
      {existing && <ClayButton label="Moment löschen" icon="trash-outline" variant="ghost" color={colors.danger} onPress={handleDelete} style={{ marginTop: 8 }} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  save: { height: 44, borderRadius: 22, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", minWidth: 92 },
  saveText: { fontFamily: fonts.display, fontSize: 16, color: colors.onAccent },
  hero: { alignItems: "center", borderRadius: radius.xl, paddingVertical: 22 },
  sticker: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-6deg" }],
    marginBottom: 12,
  },
  titleInput: { textAlign: "center", fontFamily: fonts.display, fontSize: 20 },
  emojiRow: { gap: 6, paddingTop: 2 },
  emojiChoice: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  section: { marginTop: 22 },
  ageHint: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.inkSoft, marginTop: 12, paddingHorizontal: 4 },
  photoRow: { gap: 14, paddingHorizontal: 20, paddingVertical: 10 },
  photo: { width: 104, height: 104, borderRadius: 26, borderWidth: 5, borderColor: colors.surface, backgroundColor: colors.surface, overflow: "hidden" },
  photoImg: { width: "100%", height: "100%", borderRadius: 20 },
  coverBadge: { position: "absolute", left: 6, top: 6, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  remove: {
    position: "absolute",
    right: -6,
    top: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhoto: {
    width: 104,
    height: 104,
    borderRadius: 26,
    borderWidth: 2.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.surface,
  },
  addPhotoText: { fontFamily: fonts.bodyHeavy, fontSize: 13 },
  tip: { flexDirection: "row", gap: 10, marginTop: 12, backgroundColor: colors.sunSoft, borderRadius: radius.sm, padding: 12 },
});
