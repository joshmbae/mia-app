import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BabyProfile } from "../../../types";
import { loadProfiles } from "../../../utils/storage";
import TrackerView from "../../../components/TrackerView";

export default function TrackerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<BabyProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfiles().then((profiles) => {
        setProfile(profiles.find((p) => p.id === id) ?? null);
      });
    }, [id])
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#4A7C6F" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {profile ? `${profile.name} · Tracker` : "Tracker"}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <TrackerView babyId={id} />

        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDFAF6" },
  content: { padding: 20, paddingBottom: 48 },

  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 20,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: "800", color: "#2D2A26" },
});
