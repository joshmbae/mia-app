// ─── Anmelden / Familien-Account erstellen ───────────────────────────────────

import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "../utils/supabase";
import { colors, fonts, radius, type } from "../utils/theme";
import { Screen } from "../components/ui/Screen";
import { ClayButton, ClayCard, Squish } from "../components/ui/Clay";
import { Field } from "../components/ui/Form";
import { MiaMark } from "../components/ui/MiaMark";

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
      setError("Bitte wähle ein Passwort mit mindestens 8 Zeichen.");
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
    setInfo("Fast geschafft! Bitte bestätige deine E-Mail-Adresse und melde dich dann an.");
    setMode("login");
  }

  const submit = () => (mode === "login" ? signIn(email.trim(), password) : signUp());

  return (
    <Screen keyboard contentStyle={styles.content}>
      <View style={styles.brand}>
        <MiaMark size={96} />
        <Text style={[type.hero, { marginTop: 18, textAlign: "center" }]}>
          {mode === "login" ? "Schön, dass ihr da seid" : "Willkommen bei Mia"}
        </Text>
        <Text style={[type.body, { textAlign: "center" }]}>
          {mode === "login" ? "Meldet euch mit eurem Familien-Account an." : "Erstellt euren gemeinsamen Familien-Account — alle, die ihn nutzen, sehen dasselbe Tagebuch."}
        </Text>
      </View>

      <ClayCard style={{ paddingTop: 20 }}>
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
          placeholder={mode === "signup" ? "Mindestens 8 Zeichen" : "Dein Passwort"}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          editable={!loading}
          returnKeyType="go"
          onSubmitEditing={() => ready && submit()}
        />
        {error && <Text style={[styles.message, { color: colors.danger, backgroundColor: colors.coralSoft }]}>{error}</Text>}
        {info && <Text style={[styles.message, { color: colors.mintDeep, backgroundColor: colors.mintSoft }]}>{info}</Text>}
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
        <Text style={styles.switchText}>
          {mode === "login" ? "Noch keinen Account? Jetzt erstellen" : "Schon einen Account? Anmelden"}
        </Text>
      </Squish>

      {__DEV__ && DEV_TEST_EMAIL && DEV_TEST_PASSWORD ? (
        <Squish onPress={() => signIn(DEV_TEST_EMAIL, DEV_TEST_PASSWORD)} accessibilityRole="button" style={styles.switch}>
          <Text style={[styles.switchText, { color: colors.muted }]}>Skip (Dev-Login)</Text>
        </Squish>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center", maxWidth: 480, width: "100%", alignSelf: "center" },
  brand: { alignItems: "center", gap: 8, marginBottom: 26 },
  message: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 20, borderRadius: radius.sm, padding: 12, marginBottom: 14, overflow: "hidden" },
  switch: { alignItems: "center", paddingVertical: 16 },
  switchText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.coral },
});
