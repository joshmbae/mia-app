import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function ChatComingSoon() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={styles.icon}>💬</Text>
        <Text style={styles.title}>Chat kommt bald</Text>
        <Text style={styles.subtitle}>
          Der Chat mit Mia wird gerade vorbereitet und ist in Kürze verfügbar.
        </Text>
        {router.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Zurück</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDFAF6" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#2D2A26" },
  subtitle: { fontSize: 15, color: "#7A7269", textAlign: "center", lineHeight: 21 },
  backBtn: {
    marginTop: 16,
    backgroundColor: "#4A7C6F",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
