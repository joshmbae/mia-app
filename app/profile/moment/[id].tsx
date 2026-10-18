import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BabyProfile, MomentEntry } from "../../../types";
import {
  loadProfiles,
  loadMoments,
  saveMoment,
  deleteMoment,
  uploadMomentPhoto,
  resolvePhotoUrls,
  deleteMomentPhotos,
} from "../../../utils/storage";
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_EMOJIS, CUSTOM_MOMENT_COLOR, CUSTOM_MOMENT_EMOJI } from "../../../utils/milestoneData";
import { findMilestone, toISODate, parseISODate, formatMomentDate, ageAtDate } from "../../../utils/moments";
import { colors, radius, shadow, shadowSoft, tint } from "../../../utils/theme";

const MAX_PHOTOS = 6;
const EMOJI_CHOICES = ["🌟", "🎉", "🥰", "😂", "🎈", "🌸", "🍼", "🧸", "🐶", "🏖️", "🎄", "🎵", "🍰", "🚗", "🌞", "🌙"];

interface PhotoItem {
  ref?: string;    // bereits gespeicherte Referenz
  uri: string;     // anzeigbare URI (signierte URL oder lokale Datei)
}

export default function MomentEditorScreen() {
  const { id: babyId, entryId, milestoneId: milestoneParam } = useLocalSearchParams<{
    id: string;
    entryId?: string;
    milestoneId?: string;
  }>();

  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [existing, setExisting] = useState<MomentEntry | null>(null);
  const [milestoneId, setMilestoneId] = useState<string | undefined>(milestoneParam);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState(CUSTOM_MOMENT_EMOJI);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const profiles = await loadProfiles();
      setProfile(profiles.find((p) => p.id === babyId) ?? null);
      const moments = await loadMoments(babyId);
      const entry =
        (entryId && moments.find((m) => m.id === entryId)) ||
        (milestoneParam && moments.find((m) => m.milestoneId === milestoneParam)) ||
        null;
      if (entry) {
        setExisting(entry);
        setMilestoneId(entry.milestoneId);
        setTitle(entry.title);
        if (entry.emoji) setEmoji(entry.emoji);
        setDate(parseISODate(entry.happenedOn));
        setNote(entry.note ?? "");
        const urls = await resolvePhotoUrls(entry.photos);
        setPhotos(entry.photos.map((ref) => ({ ref, uri: urls[ref] ?? ref })));
      }
      setLoaded(true);
    }
    load();
  }, [babyId, entryId, milestoneParam]);

  const milestone = findMilestone(milestoneId);
  const accent = milestone ? CATEGORY_COLORS[milestone.category] : CUSTOM_MOMENT_COLOR;
  const displayEmoji = milestone ? milestone.emoji : emoji;
  const isoDate = toISODate(date);
  const todayISO = toISODate(new Date());
  const yesterdayISO = toISODate(new Date(Date.now() - 86400000));

  // ── Fotos ──
  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Kein Zugriff", "Bitte erlaube den Zugriff auf deine Fotos in den Einstellungen.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => ({ uri: a.uri }))].slice(0, MAX_PHOTOS));
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Kein Zugriff", "Bitte erlaube den Kamera-Zugriff in den Einstellungen.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setPhotos((prev) => [...prev, { uri: result.assets[0].uri }].slice(0, MAX_PHOTOS));
  }

  function addPhoto() {
    if (Platform.OS === "web") {
      pickFromGallery();
      return;
    }
    Alert.alert("Foto hinzufügen", "", [
      { text: "Kamera", onPress: takePhoto },
      { text: "Aus Galerie", onPress: pickFromGallery },
      { text: "Abbrechen", style: "cancel" },
    ]);
  }

  // ── Speichern / Löschen ──
  async function handleSave() {
    if (!milestone && !title.trim()) {
      Alert.alert("Wie heißt der Moment?", "Gib deinem Moment einen kurzen Titel.");
      return;
    }
    setSaving(true);
    try {
      const id = existing?.id ?? (milestone ? `ms_${milestone.id}` : Date.now().toString());
      const refs = await Promise.all(photos.map((p) => p.ref ?? uploadMomentPhoto(babyId, id, p.uri)));
      const entry: MomentEntry = {
        id,
        babyId,
        milestoneId: milestone?.id,
        title: milestone ? milestone.title : title.trim(),
        emoji: displayEmoji,
        happenedOn: isoDate,
        note: note.trim() || undefined,
        photos: refs,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      await saveMoment(entry);
      const removed = (existing?.photos ?? []).filter((r) => !refs.includes(r));
      await deleteMomentPhotos(removed);
      router.back();
    } catch (err) {
      Alert.alert("Speichern fehlgeschlagen", "Bitte versuch es noch einmal.");
      setSaving(false);
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
          router.back();
        },
      },
    ]);
  }

  if (!loaded) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="close" size={22} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{existing ? "Moment bearbeiten" : "Moment festhalten"}</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: accent }]}
            disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color={colors.surface} /> : <Text style={styles.saveBtnText}>Sichern</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* ── Hero ── */}
          <View style={[styles.hero, { backgroundColor: tint(accent, 0.12) }]}>
            <View style={[styles.sticker, { borderColor: tint(accent, 0.35) }]}>
              <Text style={styles.stickerEmoji}>{displayEmoji}</Text>
            </View>
            {milestone ? (
              <>
                <Text style={[styles.heroKicker, { color: accent }]}>
                  {CATEGORY_EMOJIS[milestone.category]} {CATEGORY_LABELS[milestone.category]}
                </Text>
                <Text style={styles.heroTitle}>{milestone.title}</Text>
              </>
            ) : (
              <>
                <Text style={[styles.heroKicker, { color: accent }]}>🌟 Eigener Moment</Text>
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Was ist passiert?"
                  placeholderTextColor={colors.muted}
                  maxLength={80}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
                  {EMOJI_CHOICES.map((e) => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => setEmoji(e)}
                      style={[styles.emojiChoice, emoji === e && { backgroundColor: colors.surface, borderColor: accent }]}
                    >
                      <Text style={{ fontSize: 18 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>

          {/* ── Wann ── */}
          <Text style={styles.label}>Wann war es?</Text>
          <View style={styles.dateRow}>
            <DateChip label="Heute" active={isoDate === todayISO} color={accent} onPress={() => setDate(new Date())} />
            <DateChip
              label="Gestern"
              active={isoDate === yesterdayISO}
              color={accent}
              onPress={() => setDate(new Date(Date.now() - 86400000))}
            />
            {Platform.OS === "web" ? (
              <TextInput
                style={[styles.dateChip, styles.dateWebInput]}
                value={isoDate}
                onChangeText={(v) => {
                  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) setDate(parseISODate(v));
                }}
                placeholder="JJJJ-MM-TT"
              />
            ) : (
              <DateChip
                label={isoDate !== todayISO && isoDate !== yesterdayISO ? formatMomentDate(isoDate) : "Datum wählen"}
                icon="calendar-outline"
                active={isoDate !== todayISO && isoDate !== yesterdayISO}
                color={accent}
                onPress={() => setShowDatePicker(true)}
              />
            )}
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              maximumDate={new Date()}
              accentColor={accent}
              onChange={(_, d) => {
                setShowDatePicker(Platform.OS === "ios");
                if (d) setDate(d);
              }}
            />
          )}
          {Platform.OS === "ios" && showDatePicker && (
            <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.dateDone}>
              <Text style={[styles.dateDoneText, { color: accent }]}>Fertig</Text>
            </TouchableOpacity>
          )}
          {profile && (
            <Text style={styles.ageHint}>
              ✨ {profile.name} {ageAtDate(profile.birthDate, isoDate)} · {formatMomentDate(isoDate)}
            </Text>
          )}

          {/* ── Fotos ── */}
          <Text style={styles.label}>Fotos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {photos.map((p, i) => (
              <View key={p.ref ?? p.uri} style={[styles.photoWrap, { transform: [{ rotate: `${i % 2 === 0 ? -2 : 2}deg` }] }]}>
                <Image source={{ uri: p.uri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={13} color={colors.surface} />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity style={[styles.photoAdd, { borderColor: tint(accent, 0.5) }]} onPress={addPhoto}>
                <Ionicons name="camera-outline" size={24} color={accent} />
                <Text style={[styles.photoAddText, { color: accent }]}>Foto</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* ── Notiz ── */}
          <Text style={styles.label}>Deine Notiz</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Wie war es? Was hat euch zum Lachen gebracht? Was willst du nie vergessen?"
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
          />

          {/* ── Infos zum Meilenstein ── */}
          {milestone && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Über diesen Moment</Text>
              <Text style={styles.infoText}>{milestone.description}</Text>
              {milestone.tip && (
                <View style={styles.tipRow}>
                  <Text style={{ fontSize: 13 }}>💡</Text>
                  <Text style={styles.tipText}>{milestone.tip}</Text>
                </View>
              )}
            </View>
          )}

          {existing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={16} color={colors.coral} />
              <Text style={styles.deleteText}>Moment löschen</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DateChip({
  label, active, color, icon, onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.dateChip, active && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && <Ionicons name={icon} size={14} color={active ? colors.surface : colors.inkSoft} />}
      <Text style={[styles.dateChipText, active && { color: colors.surface }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
    ...shadowSoft,
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.ink },
  saveBtn: {
    borderRadius: radius.pill, paddingHorizontal: 16, height: 38, minWidth: 84,
    alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { color: colors.surface, fontWeight: "800", fontSize: 14 },

  content: { padding: 16, paddingBottom: 60 },

  hero: { borderRadius: radius.xl, padding: 20, alignItems: "center", marginBottom: 8, overflow: "hidden" },
  sticker: {
    width: 84, height: 84, borderRadius: 26, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center", borderWidth: 2,
    transform: [{ rotate: "-6deg" }], marginBottom: 12,
    ...shadow,
  },
  stickerEmoji: { fontSize: 42 },
  heroKicker: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: colors.ink, textAlign: "center", marginTop: 4, letterSpacing: -0.4 },
  titleInput: {
    alignSelf: "stretch", textAlign: "center",
    fontSize: 20, fontWeight: "800", color: colors.ink,
    backgroundColor: colors.surface, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, marginTop: 10,
  },
  emojiRow: { gap: 6, paddingTop: 12 },
  emojiChoice: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "transparent",
  },

  label: {
    fontSize: 12, fontWeight: "800", color: colors.muted,
    textTransform: "uppercase", letterSpacing: 0.8,
    marginTop: 20, marginBottom: 10,
  },
  dateRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  dateChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1.5, borderColor: colors.line,
  },
  dateChipText: { fontSize: 13, fontWeight: "700", color: colors.ink },
  dateWebInput: { fontSize: 13, color: colors.ink, minWidth: 130 },
  dateDone: { alignSelf: "flex-end", paddingVertical: 6, paddingHorizontal: 4 },
  dateDoneText: { fontSize: 15, fontWeight: "800" },
  ageHint: { fontSize: 13, color: colors.inkSoft, marginTop: 10 },

  photoRow: { gap: 12, paddingVertical: 6, paddingHorizontal: 2 },
  photoWrap: {
    backgroundColor: colors.surface, padding: 5, paddingBottom: 12, borderRadius: 8,
    ...shadowSoft, shadowOpacity: 0.12,
  },
  photo: { width: 96, height: 96, borderRadius: 4, backgroundColor: colors.surfaceMuted },
  photoRemove: {
    position: "absolute", top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.ink, alignItems: "center", justifyContent: "center",
  },
  photoAdd: {
    width: 106, height: 113, borderRadius: radius.md,
    borderWidth: 2, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 4,
    backgroundColor: colors.surface,
  },
  photoAddText: { fontSize: 12, fontWeight: "800" },

  noteInput: {
    minHeight: 120, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: 14, fontSize: 15, lineHeight: 22, color: colors.ink,
    borderWidth: 1.5, borderColor: colors.line,
  },

  infoCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginTop: 20,
    ...shadowSoft,
  },
  infoTitle: { fontSize: 14, fontWeight: "800", color: colors.ink, marginBottom: 6 },
  infoText: { fontSize: 13.5, color: colors.inkSoft, lineHeight: 20 },
  tipRow: {
    flexDirection: "row", gap: 8, marginTop: 10,
    backgroundColor: colors.sunSoft, borderRadius: radius.sm, padding: 10,
  },
  tipText: { flex: 1, fontSize: 12.5, color: colors.inkSoft, lineHeight: 18 },

  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 24, paddingVertical: 12,
  },
  deleteText: { color: colors.coral, fontWeight: "800", fontSize: 14 },
});
