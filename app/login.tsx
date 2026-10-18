// ─── Anmelden / Familien-Account erstellen ───────────────────────────────────

import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../utils/supabase";
import { colors, radius, size, solid, space } from "../utils/theme";
import { Screen } from "../components/ui/Screen";
import { ClayButton, ClayCard, Squish } from "../components/ui/Clay";
import { Field } from "../components/ui/Form";
import { MiaMark } from "../components/ui/MiaMark";
import { T } from "../components/ui/T";

const DEV_TEST_EMAIL = process.env.EXPO_PUBLIC_DEV_TEST_EMAIL;
const DEV_TEST_PASSWORD = process.env.EXPO_PUBLIC_DEV_TEST_PASSWORD;

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ready = !!email.trim() && password.length > 0 && !loading;

  async function signIn(mail: string, pass: string) {
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: mail, password: pass });
    setLoading(false);
    if (signInError) {
      setError("Das hat nicht geklappt. Bitte E-Mail und Passwort prüfen.");
      return;
    }
    router.replace("/");
  }

  async function signUp() {
    if (password.length < 8) {
      setError("Bitte wählt ein Passwort mit mindestens 8 Zeichen.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      router.replace("/");
      return;
    }
    setInfo("Fast geschafft! Bitte bestätigt eure E-Mail-Adresse und meldet euch dann an.");
    setMode("login");
  }

  const submit = () => (mode === "login" ? signIn(email.trim(), password) : signUp());

  return (
    <Screen keyboard contentStyle={styles.content}>
      <View style={styles.brand}>
        <MiaMark size={96} />
        <T variant="title" align="center" accessibilityRole="header" numberOfLines={2} style={styles.title}>
          {mode === "login" ? "Schön, dass ihr da seid" : "Willkommen bei Mia"}
        </T>
        <T variant="bodyLong" align="center">
          {mode === "login" ? "Meldet euch mit eurem Familien-Account an." : "Erstellt euren gemeinsamen Familien-Account — alle, die ihn nutzen, sehen dasselbe Tagebuch."}
        </T>
      </View>

      <ClayCard style={styles.card}>
        <Field
          label="E-Mail"
          value={email}
          onChangeText={setEmail}
          placeholder="familie@beispiel.de"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={!loading}
        />
        <Field
          label="Passwort"
          value={password}
          onChangeText={setPassword}
          placeholder={mode === "signup" ? "Mindestens 8 Zeichen" : "Passwort"}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          editable={!loading}
          returnKeyType="go"
          onSubmitEditing={() => ready && submit()}
        />
        {error && <Message text={error} icon="alert-circle" color={colors.danger} background={colors.coralSoft} />}
        {info && <Message text={info} icon="mail-unread" color={solid(colors.mint)} background={colors.mintSoft} />}
        <ClayButton label={mode === "login" ? "Anmelden" : "Account erstellen"} onPress={submit} loading={loading} disabled={!ready} />
      </ClayCard>

      <Squish
        onPress={() => {
          setMode((m) => (m === "login" ? "signup" : "login"));
          setError(null);
          setInfo(null);
        }}
        accessibilityRole="button"
        style={styles.switch}
      >
        <T variant="chip" color={solid(colors.coral)} align="center">
          {mode === "login" ? "Noch keinen Account? Jetzt erstellen" : "Schon einen Account? Anmelden"}
        </T>
      </Squish>

      {__DEV__ && DEV_TEST_EMAIL && DEV_TEST_PASSWORD ? (
        <Squish onPress={() => signIn(DEV_TEST_EMAIL, DEV_TEST_PASSWORD)} accessibilityRole="button" style={styles.switch}>
          <T variant="chip" color={colors.muted}>
            Skip (Dev-Login)
          </T>
        </Squish>
      ) : null}
    </Screen>
  );
}

function Message({ text, icon, color, background }: { text: string; icon: keyof typeof Ionicons.glyphMap; color: string; background: string }) {
  return (
    <View style={[styles.message, { backgroundColor: background }]} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Ionicons name={icon} size={size.icon.sm} color={color} />
      <T variant="small" color={color} style={styles.messageText}>
        {text}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", maxWidth: 480, width: "100%", alignSelf: "center" },
  brand: { alignItems: "center", gap: space.xs, marginBottom: space.lg },
  title: { marginTop: space.md },
  card: { paddingTop: space.gutter },
  message: { flexDirection: "row", gap: space.xs, borderRadius: radius.sm, padding: space.sm, marginBottom: space.md },
  messageText: { flex: 1 },
  switch: { alignItems: "center", justifyContent: "center", minHeight: size.touch, paddingVertical: space.sm, marginTop: space.xs },
});
