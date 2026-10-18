import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ParentProfile } from "../../../types";
import {
  loadParentProfiles,
  saveParentProfiles,
  deleteParentProfile,
} from "../../../utils/storage";

const ROLES: { label: string; value: ParentProfile["role"]; icon: string }[] = [
  { label: "Mutter", value: "Mutter", icon: "👩" },
  { label: "Vater", value: "Vater", icon: "👨" },
  { label: "Andere", value: "andere", icon: "🧑" },
];

export default function ParentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<ParentProfile["role"]>("Mutter");
  const [editDescription, setEditDescription] = useState("");

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const parents = await loadParentProfiles();
        const found = parents.find((p) => p.id === id) ?? null;
        setProfile(found);
        if (found) {
          setEditName(found.name);
          setEditRole(found.role);
          setEditDescription(found.description ?? "");
        }
      }
      load();
    }, [id])
  );

  async function handleSave() {
    if (!editName.trim() || !profile) return;
    const parents = await loadParentProfiles();
    const updated = parents.map((p) =>
      p.id === id
        ? {
            ...p,
            name: editName.trim(),
            role: editRole,
            description: editDescription.trim() || undefined,
          }
        : p
    );
    await saveParentProfiles(updated);
    setProfile((prev) =>
      prev
        ? { ...prev, name: editName.trim(), role: editRole, description: editDescription.trim() || undefined }
        : prev
    );
    setEditing(false);
  }

  function handleDelete() {
    Alert.alert(
      "Profil löschen?",
      "Das Elternprofil wird dauerhaft gelöscht.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            await deleteParentProfile(id);
            router.replace("/(tabs)/home");
          },
        },
      ]
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>

      {/* Hero */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#4A7C6F" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing((v) => !v)}>
          <Ionicons name={editing ? "close" : "create-outline"} size={22} color="#4A7C6F" />
        </TouchableOpacity>
        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.heroName}>{profile.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{profile.role}</Text>
        </View>
      </View>

      {/* Info */}
      <ScrollView contentContainerStyle={styles.infoContent}>
        {editing ? (
          <View>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Name"
              placeholderTextColor="#B0A89A"
            />

            <Text style={styles.label}>Rolle</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.roleBtn, editRole === r.value && styles.roleBtnActive]}
                  onPress={() => setEditRole(r.value)}
                >
                  <Text style={styles.roleIcon}>{r.icon}</Text>
                  <Text style={[styles.roleBtnText, editRole === r.value && styles.roleBtnTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Notizen</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Was du festhalten möchtest …"
              placeholderTextColor="#B0A89A"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.saveBtn, !editName.trim() && { opacity: 0.4 }]}
              onPress={handleSave}
              disabled={!editName.trim()}
            >
              <Text style={styles.saveBtnText}>Speichern</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Profil löschen</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rolle</Text>
                <Text style={styles.infoValue}>{profile.role}</Text>
              </View>
            </View>
            {profile.description ? (
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionTitle}>Notizen</Text>
                <Text style={styles.descriptionText}>{profile.description}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.addDescBtn} onPress={() => setEditing(true)}>
                <Ionicons name="add-circle-outline" size={18} color="#4A7C6F" />
                <Text style={styles.addDescBtnText}>Notiz hinzufügen</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDFAF6" },

  hero: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: "#FDFAF6",
  },
  backBtn: { position: "absolute", top: 8, left: 16, padding: 4, zIndex: 10 },
  editBtn: { position: "absolute", top: 8, right: 16, padding: 4, zIndex: 10 },
  heroAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#C8A96E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroAvatarText: { fontSize: 34, fontWeight: "800", color: "#FFFFFF" },
  heroName: { fontSize: 26, fontWeight: "800", color: "#2D2A26", letterSpacing: -0.3 },
  roleBadge: {
    marginTop: 6,
    backgroundColor: "#EAF2EF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  roleBadgeText: { fontSize: 13, fontWeight: "600", color: "#4A7C6F" },

  infoContent: { padding: 20, paddingBottom: 40 },
  infoCard: { backgroundColor: "#F0EBE3", borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: { fontSize: 14, color: "#7A7269", fontWeight: "500" },
  infoValue: { fontSize: 14, color: "#2D2A26", fontWeight: "600" },

  descriptionCard: {
    backgroundColor: "#EAF2EF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C5DDD8",
  },
  descriptionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A7C6F",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descriptionText: { fontSize: 14, color: "#2D2A26", lineHeight: 21 },

  addDescBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#C5DDD8",
    borderStyle: "dashed",
    borderRadius: 14,
  },
  addDescBtnText: { color: "#4A7C6F", fontSize: 15, fontWeight: "600" },

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
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  roleBtn: {
    flex: 1, alignItems: "center", paddingVertical: 14,
    borderRadius: 14, backgroundColor: "#F0EBE3", gap: 6,
  },
  roleBtnActive: { backgroundColor: "#4A7C6F" },
  roleIcon: { fontSize: 24 },
  roleBtnText: { fontSize: 13, fontWeight: "600", color: "#7A7269" },
  roleBtnTextActive: { color: "#FFFFFF" },
  saveBtn: {
    backgroundColor: "#4A7C6F", borderRadius: 14,
    paddingVertical: 17, alignItems: "center", marginTop: 8,
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  deleteBtn: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#C0392B",
  },
  deleteBtnText: { color: "#C0392B", fontSize: 16, fontWeight: "600" },
});
