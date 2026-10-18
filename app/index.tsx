import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../utils/supabase";
import { useFamily } from "../utils/family";
import { colors } from "../utils/theme";
import { MiaMark } from "../components/ui/MiaMark";

type Target = "login" | "onboarding" | "app";

export default function Index() {
  const { refresh } = useFamily();
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    async function decide() {
      const [{ data }, onboarded] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem("mia_onboarded").catch(() => null),
      ]);
      if (!data.session) return setTarget("login");
      if (!onboarded) return setTarget("onboarding");
      await refresh();
      setTarget("app");
    }
    decide();
  }, [refresh]);

  if (target === "login") return <Redirect href="/login" />;
  if (target === "onboarding") return <Redirect href="/onboarding" />;
  if (target === "app") return <Redirect href="/(tabs)/start" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 24 }}>
      <MiaMark size={88} />
      <ActivityIndicator color={colors.coral} />
    </View>
  );
}
