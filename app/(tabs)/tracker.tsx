import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BabyProfile } from "../../types";
import { loadProfiles } from "../../utils/storage";
import TrackerView from "../../components/TrackerView";

export default function TrackerTab() {
  const [profiles, setProfiles] = useState<BabyProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfiles().then((ps) => {
        setProfiles(ps);
        setSelectedId((current) => current ?? ps[0]?.id ?? null);
      });
    }, [])
  );

  if (profiles.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👶</Text>
          <Text style={styles.emptyText}>Noch kein Kind angelegt.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/profile/new")}>
            <Text style={styles.emptyBtnText}>Kind hinzufügen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Text style={styles.title}>Tracker</Text>

          {/* Child selector */}
          {profiles.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll} contentContainerStyle={styles.selectorContent}>
              {profiles.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.selectorChip, selectedId === p.id && { backgroundColor: p.avatarColor, borderColor: p.avatarColor }]}
                  onPress={() => setSelectedId(p.id)}
                >
                  <View style={[styles.selectorDot, { backgroundColor: selectedId === p.id ? "rgba(255,255,255,0.5)" : p.avatarColor }]} />
                  <Text style={[styles.selectorText, selectedId === p.id && { color: "#FFFFFF" }]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selectedId && <TrackerView key={selectedId} babyId={selectedId} />}

        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDFAF6" },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: "800", color: "#2D2A26", marginBottom: 16, paddingTop: 8 },

  selectorScroll: { marginBottom: 16 },
  selectorContent: { gap: 8, paddingRight: 4 },
  selectorChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#F0EBE3", borderWidth: 1.5, borderColor: "#E5DDD5",
  },
  selectorDot: { width: 8, height: 8, borderRadius: 4 },
  selectorText: { fontSize: 14, fontWeight: "600", color: "#2D2A26" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: "#7A7269" },
  emptyBtn: { backgroundColor: "#4A7C6F", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
