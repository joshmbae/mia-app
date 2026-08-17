import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../utils/supabase";

export default function Index() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    AsyncStorage.getItem("mia_onboarded").then((val) => setOnboarded(!!val));
  }, []);

  if (loggedIn === null || onboarded === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FDFAF6", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#4A7C6F" />
      </View>
    );
  }

  if (!loggedIn) return <Redirect href="/login" />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/home" />;
}
