import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "../utils/supabase";

const DEV_TEST_EMAIL = process.env.EXPO_PUBLIC_DEV_TEST_EMAIL;
const DEV_TEST_PASSWORD = process.env.EXPO_PUBLIC_DEV_TEST_PASSWORD;

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError("Login fehlgeschlagen. E-Mail oder Passwort prüfen.");
      return;
    }
    router.replace("/");
  }

  async function handleSignup() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      router.replace("/");
      return;
    }
    setInfo("Konto erstellt! Bitte bestätige deine E-Mail-Adresse und melde dich dann an.");
    setMode("login");
  }

  const submit = mode === "login" ? handleLogin : handleSignup;

  async function handleDevSkip() {
    if (!DEV_TEST_EMAIL || !DEV_TEST_PASSWORD) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: DEV_TEST_EMAIL,
      password: DEV_TEST_PASSWORD,
    });
    setLoading(false);
    if (signInError) {
      setError(`Dev-Login fehlgeschlagen: ${signInError.message}`);
      return;
    }
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Willkommen bei Mia</Text>
          <Text style={styles.subtitle}>
            {mode === "login"
              ? "Melde dich mit eurem Familien-Account an."
              : "Erstellt euren gemeinsamen Familien-Account."}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="E-Mail"
            placeholderTextColor="#B0A89A"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Passwort"
            placeholderTextColor="#B0A89A"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {info && <Text style={styles.info}>{info}</Text>}

          <TouchableOpacity
            style={[styles.button, (!email.trim() || !password || loading) && styles.buttonDisabled]}
            onPress={submit}
            disabled={!email.trim() || !password || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "login" ? "Anmelden" : "Konto erstellen"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeBtn}
            onPress={() => {
              setMode((m) => (m === "login" ? "signup" : "login"));
              setError(null);
              setInfo(null);
            }}
          >
            <Text style={styles.switchModeText}>
              {mode === "login"
                ? "Noch keinen Account? Jetzt erstellen"
                : "Schon einen Account? Anmelden"}
            </Text>
          </TouchableOpacity>
          {__DEV__ && DEV_TEST_EMAIL && DEV_TEST_PASSWORD && (
            <TouchableOpacity style={styles.devSkipBtn} onPress={handleDevSkip} disabled={loading}>
              <Text style={styles.devSkipText}>Skip (Dev-Login)</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDFAF6" },
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#2D2A26", marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#7A7269", marginBottom: 16 },
  input: {
    backgroundColor: "#F0EBE3",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#2D2A26",
  },
  error: { color: "#C0392B", fontSize: 13, marginTop: 4 },
  info: { color: "#4A7C6F", fontSize: 13, marginTop: 4 },
  button: {
    backgroundColor: "#4A7C6F",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  switchModeBtn: { alignItems: "center", marginTop: 8, paddingVertical: 8 },
  switchModeText: { color: "#7A7269", fontSize: 13, fontWeight: "600" },
  devSkipBtn: { alignItems: "center", marginTop: 20, paddingVertical: 8 },
  devSkipText: { color: "#B0A89A", fontSize: 12, fontWeight: "600" },
});
