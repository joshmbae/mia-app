// ─── Moment festhalten / bearbeiten ──────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
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
import { colors, elevation, emoji as emojiStyle, radius, size, soft, solid, space, type } from "../../utils/theme";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayButton, ClayCard, Squish } from "../../components/ui/Clay";
import { DateField, Field, FieldLabel } from "../../components/ui/Form";
import { T } from "../../components/ui/T";
import { useUnsavedGuard } from "../../components/ui/useUnsavedGuard";

const MAX_PHOTOS = 8;
const EMOJIS = ["🌟", "🎉", "🥰", "😂", "🎈", "🌸", "🍼", "🧸", "🐶", "🏖️", "🎄", "🎂", "🎵", "🚗", "🌞", "🌙", "🍓", "⚽", "📚", "💌"];

interface PhotoItem {
  ref?: string; // bereits gespeicherte Referenz
  uri: string;  // anzeigbare URI
}

/** Vergleichbarer Zustand des Formulars — für den Schutz vor ungespeicherten Änderungen */
function snapshot(v: { milestoneId?: string; title: string; emoji: string; date: string; note: string; photos: string[] }): string {
  return JSON.stringify([v.milestoneId ?? "", v.title, v.emoji, v.date, v.note, v.photos]);
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
  const [initial, setInitial] = useState(() =>
    snapshot({ milestoneId: params.milestone, title: params.title ?? "", emoji: CUSTOM_MOMENT_EMOJI, date: todayISO(), note: "", photos: [] })
  );

  // Nach dem Speichern/Löschen erst den Schutz lösen, dann navigieren
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

  const current = snapshot({ milestoneId, title, emoji, date, note, photos: photos.map((p) => p.ref ?? p.uri) });
  useUnsavedGuard(loaded && !done && current !== initial);

  useEffect(() => {
    if (!params.entry || !child) return;
    loadMoment(child.id, params.entry).then(async (entry) => {
      if (entry) {
        const entryEmoji = entry.emoji ?? CUSTOM_MOMENT_EMOJI;
        setExisting(entry);
        setMilestoneId(entry.milestoneId);
        setTitle(entry.title);
        setEmoji(entryEmoji);
        setDate(entry.happenedOn);
        setNote(entry.note ?? "");
        const urls = await resolvePhotoUrls(entry.photos);
        setPhotos(entry.photos.map((ref) => ({ ref, uri: urls[ref] ?? ref })));
        setInitial(
          snapshot({ milestoneId: entry.milestoneId, title: entry.title, emoji: entryEmoji, date: entry.happenedOn, note: entry.note ?? "", photos: entry.photos })
        );
      }
      setLoaded(true);
    });
  }, [params.entry, child?.id]);

  if (!child || !loaded) {
    return (
      <Screen blobs="none">
        <ActivityIndicator color={colors.coral} style={{ marginTop: space.xxl }} />
      </Screen>
    );
  }

  const milestone = findMilestone(milestoneId);
  const accent = milestone ? CATEGORY_COLORS[milestone.category] : CUSTOM_MOMENT_COLOR;
  const accentText = solid(accent);
  const shownEmoji = milestone ? milestone.emoji : emoji;
  const valid = !!milestone || !!title.trim();
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
    if (!child || !valid) return;
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
      const childId = child.id;
      if (existing) finish(() => router.back());
      else
        finish(() => {
          // Modal schließen und den neuen Moment als normale Seite öffnen
          router.dismissAll();
          router.push(`/moment/${id}?child=${childId}&neu=1`);
        });
    } catch {
      setSaving(false);
      Alert.alert("Speichern hat nicht geklappt", "Bitte prüft eure Verbindung und versucht es noch einmal.");
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
          finish(() => router.dismissAll());
        },
      },
    ]);
  }

  return (
    <Screen keyboard blobs="none">
      <Header
        title={existing ? "Bearbeiten" : "Neuer Moment"}
        subtitle={child.name}
        backIcon="close"
        right={<SavePill onPress={handleSave} color={accent} disabled={!valid} loading={saving} hint="Gebt dem Moment zuerst einen Titel." />}
      />

      {/* Held */}
      <ClayCard color={soft(accent)} style={styles.hero}>
        <View style={[styles.sticker, elevation.raised]}>
          <Text style={emojiStyle(44)} accessibilityElementsHidden importantForAccessibility="no">
            {shownEmoji}
          </Text>
        </View>
        {milestone ? (
          <>
            <T variant="label" color={accentText}>
              {CATEGORY_EMOJIS[milestone.category]}  {CATEGORY_LABELS[milestone.category]}
            </T>
            <T variant="h1" align="center" style={{ marginTop: space.xxs }}>
              {milestone.title}
            </T>
          </>
        ) : (
          <>
            <T variant="label" color={accentText} style={{ marginBottom: space.xs }}>
              Eigener Moment
            </T>
            <Field
              value={title}
              onChangeText={setTitle}
              placeholder="Was ist passiert?"
              accessibilityLabel="Titel des Moments"
              maxLength={80}
              style={styles.titleInput}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow} accessibilityLabel="Symbol wählen">
              {EMOJIS.map((e) => (
                <Squish
                  key={e}
                  onPress={() => setEmoji(e)}
                  accessibilityRole="button"
                  accessibilityLabel={`Symbol ${e}`}
                  accessibilityState={{ selected: emoji === e }}
                  style={[styles.emojiChoice, emoji === e && { backgroundColor: colors.surface, borderColor: accentText }]}
                >
                  <Text style={emojiStyle(20)}>{e}</Text>
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
        <T variant="small" style={styles.ageHint}>
          ✨ {child.name} {ageHint}
        </T>
      </View>

      {/* Fotos */}
      <View style={styles.section}>
        <FieldLabel hint={photos.length > 1 ? "Tippt ein Foto an, um es zum Titelbild zu machen." : undefined}>Fotos</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow} style={styles.photoScroll}>
          {photos.map((p, i) => (
            <View key={p.ref ?? p.uri} style={{ transform: [{ rotate: `${i % 2 === 0 ? -3 : 3}deg` }] }}>
              <Squish
                onPress={() => i > 0 && setPhotos((prev) => [prev[i], ...prev.filter((_, j) => j !== i)])}
                accessibilityRole="button"
                accessibilityLabel={i === 0 ? `Foto ${i + 1} von ${photos.length}, Titelbild` : `Foto ${i + 1} von ${photos.length}, als Titelbild verwenden`}
                style={[styles.photo, elevation.raised]}
              >
                <Image source={{ uri: p.uri }} style={styles.photoImg} />
                {i === 0 && photos.length > 1 && (
                  <View style={[styles.coverBadge, { backgroundColor: accentText }]}>
                    <Ionicons name="star" size={12} color={colors.onAccent} />
                  </View>
                )}
              </Squish>
              <Squish
                onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                accessibilityRole="button"
                accessibilityLabel={`Foto ${i + 1} entfernen`}
                hitSlop={space.xs}
                style={styles.remove}
              >
                <Ionicons name="close" size={size.icon.sm - 2} color={colors.onAccent} />
              </Squish>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <Squish onPress={addPhotos} accessibilityRole="button" accessibilityLabel="Foto hinzufügen" style={[styles.addPhoto, { borderColor: accent }]}>
              <Ionicons name="camera" size={size.icon.lg} color={accentText} />
              <T variant="chip" color={accentText}>
                {photos.length ? "Noch eins" : "Foto"}
              </T>
            </Squish>
          )}
        </ScrollView>
      </View>

      {/* Notiz */}
      <View style={styles.section}>
        <Field
          label="Notiz"
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Wie war es? Was hat euch zum Lachen gebracht? Was wollt ihr nie vergessen?"
        />
      </View>

      {milestone && (
        <ClayCard>
          <T variant="h3" style={{ marginBottom: space.xs }}>
            Über diesen Moment
          </T>
          <T variant="body">{milestone.description}</T>
          {milestone.tip && (
            <View style={styles.tip}>
              <Text style={emojiStyle(16)} accessibilityElementsHidden importantForAccessibility="no">
                💡
              </Text>
              <T variant="body" style={{ flex: 1 }}>
                {milestone.tip}
              </T>
            </View>
          )}
        </ClayCard>
      )}

      {existing && (
        <ClayButton label="Moment löschen" icon="trash-outline" variant="ghost" color={colors.danger} onPress={handleDelete} style={{ marginTop: space.lg }} />
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
  hero: { alignItems: "center", borderRadius: radius.xl, paddingVertical: space.lg },
  sticker: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-6deg" }],
    marginBottom: space.sm,
  },
  titleInput: { ...type.h2, textAlign: "center", color: colors.ink },
  emojiRow: { gap: space.xxs },
  emojiChoice: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  section: { marginTop: space.section },
  ageHint: { marginTop: space.sm, paddingHorizontal: space.xxs },
  photoScroll: { marginHorizontal: -space.gutter },
  photoRow: { gap: space.md, paddingHorizontal: space.gutter, paddingVertical: space.sm },
  photo: {
    width: 104,
    height: 104,
    borderRadius: radius.lg,
    borderWidth: space.xxs,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  photoImg: { width: "100%", height: "100%", borderRadius: radius.md },
  coverBadge: {
    position: "absolute",
    left: space.xxs,
    top: space.xxs,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  // Sichtbar 28 pt, mit hitSlop 8 rundum 44 pt Tippfläche
  remove: {
    position: "absolute",
    right: -space.xs,
    top: -space.xs,
    width: size.pill,
    height: size.pill,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhoto: {
    width: 104,
    height: 104,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xxs,
    backgroundColor: colors.surface,
  },
  tip: { flexDirection: "row", gap: space.xs, marginTop: space.sm, backgroundColor: colors.sunSoft, borderRadius: radius.sm, padding: space.sm },
});
