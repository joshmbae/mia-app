import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BabyProfile, MomentEntry } from "../../types";
import { loadProfiles, loadMoments } from "../../utils/storage";
import { getCurrentPhase } from "../../utils/developmentPhases";
import { momentEmoji } from "../../utils/moments";

// ─── Constants ───────────────────────────────────────────────────────────────

const FEEDING_LABELS: Record<BabyProfile["feedingType"], string> = {
  breastfed: "Gestillt",
  formula: "Formulanahrung",
  mixed: "Gestillt & Formula",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function berechneAlter(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 14) return `${d} ${d === 1 ? "Tag" : "Tage"} alt`;
  const w = Math.floor(d / 7), wd = d % 7;
  if (d < 112) return wd > 0 ? `${w} Wo. ${wd} T. alt` : `${w} Wochen alt`;
  const mo = Math.floor(d / 30.44), mw = Math.floor((d % 30.44) / 7);
  if (d < 730) return mw > 0 ? `${mo} Mo. ${mw} Wo. alt` : `${mo} Monate alt`;
  const y = Math.floor(d / 365), m = Math.floor((d % 365) / 30);
  return m > 0 ? `${y} J. ${m} Mo.` : `${y} Jahre alt`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [moments, setMoments] = useState<MomentEntry[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const profiles = await loadProfiles();
        const found = profiles.find((p) => p.id === id) ?? null;
        setProfile(found);
        setMoments(await loadMoments(id));
      }
      load();
    }, [id])
  );

  if (!profile) return null;

  const GENDER_LABELS: Record<string, string> = { male: "Junge", female: "Mädchen", other: "Divers" };

  const rows: { label: string; value: string }[] = [
    {
      label: "Geburtsdatum",
      value: new Date(profile.birthDate).toLocaleDateString("de-DE", {
        day: "2-digit", month: "long", year: "numeric",
      }),
    },
    { label: "Ernährung", value: FEEDING_LABELS[profile.feedingType] },
  ];
  if (profile.gender) rows.push({ label: "Geschlecht", value: GENDER_LABELS[profile.gender] });
  if (profile.premature !== undefined) rows.push({ label: "Frühgeburt", value: profile.premature ? "Ja" : "Nein" });
  if (profile.siblings) rows.push({ label: "Geschwister", value: profile.siblings });
  if (profile.medicalNotes) rows.push({ label: "Med. Besonderheiten", value: profile.medicalNotes });
  if (profile.description) rows.push({ label: "Notizen", value: profile.description });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>

      {/* ── Hero Header ── */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#4A7C6F" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/profile/edit/${id}`)}>
          <Ionicons name="create-outline" size={22} color="#4A7C6F" />
        </TouchableOpacity>

        {profile.photoUri ? (
          <Image source={{ uri: profile.photoUri }} style={styles.heroPhoto} />
        ) : (
          <View style={[styles.heroAvatar, { backgroundColor: profile.avatarColor }]}>
            <Text style={styles.heroAvatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <Text style={styles.heroName}>{profile.name}</Text>
        <Text style={styles.heroAge}>{berechneAlter(profile.birthDate)}</Text>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── 1. Tagebuch ── */}
        {(() => {
          const currentPhase = getCurrentPhase(profile.birthDate);
          const recent = moments.slice(-5).reverse();
          return (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📖 Tagebuch</Text>
              </View>
              <TouchableOpacity
                style={styles.devCard}
                onPress={() => router.push(`/profile/development/${id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.devCardTop}>
                  {currentPhase && (
                    <View style={[styles.devCardPhaseBadge, { backgroundColor: "#EAF2EF" }]}>
                      <Text style={[styles.devCardPhaseText, { color: "#4A7C6F" }]}>
                        {currentPhase.emoji} {currentPhase.title}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#4A7C6F" style={{ marginLeft: "auto" }} />
                </View>
                <Text style={styles.devCardTitle}>
                  {moments.length > 0 ? `${moments.length} ${moments.length === 1 ? "Moment" : "Momente"} festgehalten` : "Eure Geschichte beginnt hier"}
                </Text>
                <Text style={styles.devCardSummary} numberOfLines={2}>
                  {moments.length > 0
                    ? "Zeitstrahl, Fotos und Notizen — und am Ende vielleicht ein Buch."
                    : "Halte besondere Momente mit Foto und ein paar Zeilen fest."}
                </Text>
                <View style={styles.devCardFooter}>
                  {recent.length > 0 ? (
                    recent.map((m) => (
                      <View key={m.id} style={styles.devCardSticker}>
                        <Text style={{ fontSize: 16 }}>{momentEmoji(m)}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.devCardProgressPill}>
                      <Text style={styles.devCardProgressText}>＋ Moment festhalten</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </>
          );
        })()}

        {/* ── 2. Tracker ── */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>📊 Tracker</Text>
        </View>

        <TouchableOpacity
          style={[styles.toolBtn, { borderColor: "#C5DDD8" }]}
          onPress={() => router.push(`/profile/weight/${profile.id}`)}
          activeOpacity={0.85}
        >
          <View style={[styles.toolBtnIcon, { backgroundColor: "#EAF2EF" }]}>
            <Text style={{ fontSize: 18 }}>📈</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toolBtnTitle}>Gewichtsverlauf</Text>
            <Text style={styles.toolBtnSub}>
              {profile.weightGrams ? `Geburtsgewicht: ${profile.weightGrams} g` : "Wachstum & WHO-Kurven"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#4A7C6F" />
        </TouchableOpacity>

        {/* ── 3. Still & Schlaf Tracker ── */}
        <TouchableOpacity
          style={[styles.toolBtn, { borderColor: "#DEC8F0" }]}
          onPress={() => router.push(`/profile/tracker/${profile.id}`)}
          activeOpacity={0.85}
        >
          <View style={[styles.toolBtnIcon, { backgroundColor: "#EEE0F8" }]}>
            <Text style={{ fontSize: 18 }}>🤱</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toolBtnTitle}>Still & Schlaf Tracker</Text>
            <Text style={styles.toolBtnSub}>Zeiten aufzeichnen & auswerten</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9B7BB8" />
        </TouchableOpacity>

        {/* ── 4. Profil-Infos (klappbar) ── */}
        <TouchableOpacity
          style={[styles.sectionHeader, { marginTop: 24 }]}
          onPress={() => setShowInfo((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>📋 Profilinfos</Text>
          <Ionicons name={showInfo ? "chevron-up" : "chevron-down"} size={16} color="#B0A89A" />
        </TouchableOpacity>

        {showInfo && (
          <View style={styles.infoCard}>
            {rows.map((row, i) => (
              <View key={row.label} style={[styles.infoRow, i < rows.length - 1 && styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const SHADOW = {
  shadowColor: "#2D2A26",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 10,
  elevation: 3,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDFAF6" },

  // Hero
  hero: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: "#FDFAF6",
  },
  backBtn: { position: "absolute", top: 8, left: 16, padding: 4, zIndex: 10 },
  editBtn: { position: "absolute", top: 8, right: 16, padding: 4, zIndex: 10 },
  heroPhoto: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  heroAvatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  heroAvatarText: { fontSize: 40, fontWeight: "800", color: "#FFFFFF" },
  heroName: { fontSize: 26, fontWeight: "800", color: "#2D2A26", letterSpacing: -0.3 },
  heroAge: { fontSize: 14, color: "#7A7269", marginTop: 4 },

  // Scrollable content
  content: { padding: 20, paddingBottom: 48 },

  // Info Card
  infoCard: {
    backgroundColor: "#F0EBE3",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 16,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#E5DDD5" },
  infoLabel: { fontSize: 14, color: "#7A7269", fontWeight: "500", flex: 1 },
  infoValue: { fontSize: 14, color: "#2D2A26", fontWeight: "600", flex: 2, textAlign: "right" },

  // Development entry card
  devCard: {
    backgroundColor: "#EAF2EF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#C5DDD8",
  },
  devCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  devCardBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  devCardBadgeText: { fontSize: 12, fontWeight: "700", color: "#4A7C6F" },
  devCardTitle: { fontSize: 17, fontWeight: "800", color: "#2D2A26", marginBottom: 6 },
  devCardSummary: { fontSize: 13, color: "#4A6B62", lineHeight: 19, marginBottom: 12 },
  devCardFooter: { flexDirection: "row", gap: 6 },
  devCardSticker: {
    width: 34, height: 34, borderRadius: 12, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
  },
  devCardProgressPill: {
    backgroundColor: "#4A7C6F",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  devCardProgressText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  devCardPhaseBadge: {
    flex: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 4,
  },
  devCardPhaseText: { fontSize: 11, fontWeight: "700" },
  phaseBadgeChip: {
    backgroundColor: "#4A7C6F", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3,
  },
  phaseBadgeChipText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },

  // Tool buttons (Gewicht, Tracker)
  toolBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", borderRadius: 16,
    padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1.5,
    shadowColor: "#2D2A26", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  toolBtnIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  toolBtnTitle: { fontSize: 15, fontWeight: "700", color: "#2D2A26" },
  toolBtnSub: { fontSize: 12, color: "#7A7269", marginTop: 2 },

  // Section header
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#2D2A26", letterSpacing: -0.2 },
});
