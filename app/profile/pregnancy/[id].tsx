import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PregnancyProfile } from "../../../types";
import {
  loadPregnancyProfiles,
  savePregnancyProfiles,
  deletePregnancyProfile,
} from "../../../utils/storage";

const AVATAR_COLORS = ["#9B7BB8", "#D4856A", "#4A7C6F", "#7B9EC8", "#C8A96E"];

function calcWeeks(dueDateISO: string): number {
  const daysUntilDue = Math.floor(
    (new Date(dueDateISO).getTime() - Date.now()) / 86400000
  );
  const daysPregnant = 280 - daysUntilDue;
  return Math.max(0, Math.min(42, Math.floor(daysPregnant / 7)));
}

function calcDaysLeft(dueDateISO: string): number {
  return Math.max(0, Math.floor((new Date(dueDateISO).getTime() - Date.now()) / 86400000));
}

export default function PregnancyProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editDueDate, setEditDueDate] = useState(new Date());
  const [editDescription, setEditDescription] = useState("");
  const [editAvatarColor, setEditAvatarColor] = useState(AVATAR_COLORS[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const profiles = await loadPregnancyProfiles();
        const found = profiles.find((p) => p.id === id) ?? null;
        setProfile(found);
        setLoaded(true);
        if (!found) {
          router.replace("/(tabs)/home");
          return;
        }
        if (found) {
          setEditNickname(found.nickname);
          setEditDueDate(new Date(found.dueDate));
          setEditDescription(found.description ?? "");
          setEditAvatarColor(found.avatarColor);
        }
      }
      load();
    }, [id])
  );

  async function handleSave() {
    if (!profile) return;
    const profiles = await loadPregnancyProfiles();
    const updated = profiles.map((p) =>
      p.id === id
        ? {
            ...p,
            nickname: editNickname.trim() || "Mein Baby",
            dueDate: editDueDate.toISOString(),
            avatarColor: editAvatarColor,
            description: editDescription.trim() || undefined,
          }
        : p
    );
    await savePregnancyProfiles(updated);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            nickname: editNickname.trim() || "Mein Baby",
            dueDate: editDueDate.toISOString(),
            avatarColor: editAvatarColor,
            description: editDescription.trim() || undefined,
          }
        : prev
    );
    setEditing(false);
  }

  function handleDelete() {
    Alert.alert(
      "Schwangerschaft löschen?",
      "Das Profil wird dauerhaft gelöscht.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            await deletePregnancyProfile(id);
            router.replace("/(tabs)/home");
          },
        },
      ]
    );
  }

  if (!profile) return null;

  const weeks = calcWeeks(profile.dueDate);
  const daysLeft = calcDaysLeft(profile.dueDate);
  const formattedDue = new Date(profile.dueDate).toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>

      {/* Hero */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#9B7BB8" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing((v) => !v)}>
          <Ionicons name={editing ? "close" : "create-outline"} size={22} color="#9B7BB8" />
        </TouchableOpacity>
        <View style={[styles.heroAvatar, { backgroundColor: profile.avatarColor }]}>
          <Text style={styles.heroEmoji}>🤰</Text>
        </View>
        <Text style={styles.heroName}>{profile.nickname}</Text>
        <View style={styles.progressRow}>
          <View style={styles.weeksBadge}>
            <Text style={styles.weeksBadgeText}>SSW {weeks}</Text>
          </View>
          <Text style={styles.daysLeft}>
            {daysLeft > 0 ? `noch ${daysLeft} Tage` : "Geburtstermin erreicht 🎉"}
          </Text>
        </View>
      </View>

      {/* Info */}
      <ScrollView contentContainerStyle={styles.infoContent}>
        {editing ? (
          <View>
            <Text style={styles.label}>Spitzname</Text>
            <TextInput
              style={styles.input}
              value={editNickname}
              onChangeText={setEditNickname}
              placeholder="z. B. Erdnuss"
              placeholderTextColor="#B0A89A"
            />

            <Text style={styles.label}>Errechneter Geburtstermin</Text>
            <TouchableOpacity style={styles.dateTrigger} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color="#9B7BB8" />
              <Text style={styles.dateTriggerText}>
                {editDueDate.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={editDueDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (date) setEditDueDate(date);
                }}
              />
            )}
            {Platform.OS === "ios" && showDatePicker && (
              <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.dateConfirmBtn}>
                <Text style={styles.dateConfirmText}>Fertig</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.label}>Avatar-Farbe</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    editAvatarColor === color && styles.colorCircleSelected,
                  ]}
                  onPress={() => setEditAvatarColor(color)}
                />
              ))}
            </View>

            <Text style={styles.label}>Notizen</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="z. B. Erste Schwangerschaft, leichte Übelkeit..."
              placeholderTextColor="#B0A89A"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Speichern</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Schwangerschaft löschen</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* ── Entwicklungs-Einstieg ── */}
            <TouchableOpacity
              style={styles.devCard}
              onPress={() => router.push(`/profile/pregnancy-development/${id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.devCardTop}>
                <View style={styles.devCardBadge}>
                  <Text style={styles.devCardBadgeText}>🧬 SSW {weeks}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9B7BB8" />
              </View>
              <Text style={styles.devCardTitle}>Entwicklung diese Woche</Text>
              <Text style={styles.devCardSub}>Baby, Körper, Warnzeichen & To-Dos</Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Geburtstermin</Text>
                <Text style={styles.infoValue}>{formattedDue}</Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>Schwangerschaftswoche</Text>
                <Text style={styles.infoValue}>SSW {weeks}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Noch bis Termin</Text>
                <Text style={styles.infoValue}>{daysLeft > 0 ? `${daysLeft} Tage` : "Termin erreicht"}</Text>
              </View>
            </View>

            {profile.description ? (
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionTitle}>Notizen</Text>
                <Text style={styles.descriptionText}>{profile.description}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.addDescBtn} onPress={() => setEditing(true)}>
                <Ionicons name="add-circle-outline" size={18} color="#9B7BB8" />
                <Text style={styles.addDescBtnText}>Notiz hinzufügen</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom button (nicht beim Bearbeiten) */}
      {!editing && (
        <View style={styles.bottomBtnWrapper}>
          <TouchableOpacity
            style={styles.babyIsDaBtn}
            onPress={() => router.push(`/profile/pregnancy-convert/${id}`)}
          >
            <Text style={styles.babyIsDaBtnText}>🎉 Baby ist da!</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDFAF6" },

  // Development entry card
  devCard: {
    backgroundColor: "#F5EEF9",
    borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: "#DEC8F0",
  },
  devCardTop: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
  },
  devCardBadge: {
    backgroundColor: "#FFFFFF", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  devCardBadgeText: { fontSize: 12, fontWeight: "700", color: "#9B7BB8" },
  devCardTitle: { fontSize: 17, fontWeight: "800", color: "#2D2A26", marginBottom: 4 },
  devCardSub: { fontSize: 13, color: "#7B5B9A" },

  hero: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: "#FDFAF6",
  },
  backBtn: { position: "absolute", top: 8, left: 16, padding: 4, zIndex: 10 },
  editBtn: { position: "absolute", top: 8, right: 16, padding: 4, zIndex: 10 },
  heroAvatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  heroEmoji: { fontSize: 40 },
  heroName: { fontSize: 24, fontWeight: "800", color: "#2D2A26", letterSpacing: -0.3 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  weeksBadge: {
    backgroundColor: "#9B7BB8", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  weeksBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  daysLeft: { fontSize: 13, color: "#7A7269" },

  infoContent: { padding: 20, paddingBottom: 100 },

  infoCard: { backgroundColor: "#F0EBE3", borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  infoRowBorder: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E5DDD5" },
  infoLabel: { fontSize: 14, color: "#7A7269", fontWeight: "500" },
  infoValue: { fontSize: 14, color: "#2D2A26", fontWeight: "600" },

  descriptionCard: {
    backgroundColor: "#F0EAF7", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#C5ADE0",
  },
  descriptionTitle: {
    fontSize: 12, fontWeight: "700", color: "#9B7BB8",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
  },
  descriptionText: { fontSize: 14, color: "#2D2A26", lineHeight: 21 },
  addDescBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderWidth: 1.5, borderColor: "#C5ADE0",
    borderStyle: "dashed", borderRadius: 14,
  },
  addDescBtnText: { color: "#9B7BB8", fontSize: 15, fontWeight: "600" },

  label: {
    fontSize: 13, fontWeight: "700", color: "#7A7269",
    letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10,
  },
  input: {
    backgroundColor: "#F0EBE3", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: "#2D2A26", marginBottom: 24,
  },
  inputMultiline: { height: 110, textAlignVertical: "top", paddingTop: 14 },
  dateTrigger: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F0EBE3", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 24,
  },
  dateTriggerText: { fontSize: 16, color: "#2D2A26", flex: 1 },
  dateConfirmBtn: { alignSelf: "flex-end", paddingVertical: 6, paddingHorizontal: 16, marginBottom: 16 },
  dateConfirmText: { color: "#9B7BB8", fontWeight: "700", fontSize: 15 },
  colorRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  colorCircle: { width: 36, height: 36, borderRadius: 18 },
  colorCircleSelected: { borderWidth: 3, borderColor: "#2D2A26" },
  saveBtn: {
    backgroundColor: "#9B7BB8", borderRadius: 14,
    paddingVertical: 17, alignItems: "center", marginTop: 8,
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  deleteBtn: {
    marginTop: 16, paddingVertical: 16, alignItems: "center",
    borderRadius: 14, borderWidth: 1.5, borderColor: "#C0392B",
  },
  deleteBtnText: { color: "#C0392B", fontSize: 16, fontWeight: "600" },
  bottomBtnWrapper: { position: "absolute", bottom: 24, left: 20, right: 20, gap: 10 },
  babyIsDaBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4A7C6F",
  },
  babyIsDaBtnText: { fontSize: 16, fontWeight: "700", color: "#4A7C6F" },
  emptyState: { alignItems: "center", padding: 48, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: "#7A7269", textAlign: "center", lineHeight: 22 },
});
