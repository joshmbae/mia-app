import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from "@expo-google-fonts/nunito";
import * as SplashScreen from "expo-splash-screen";
import { FamilyProvider } from "../utils/family";
import { colors } from "../utils/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FamilyProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="moment/neu" options={{ presentation: "modal" }} />
          <Stack.Screen name="moment/bearbeiten" options={{ presentation: "modal" }} />
          <Stack.Screen name="moment/[id]" />
          <Stack.Screen name="messung" options={{ presentation: "modal" }} />
          <Stack.Screen name="phasen" />
          <Stack.Screen name="kind/neu" options={{ presentation: "modal" }} />
          <Stack.Screen name="kind/bearbeiten" options={{ presentation: "modal" }} />
          <Stack.Screen name="schwangerschaft/neu" options={{ presentation: "modal" }} />
          <Stack.Screen name="schwangerschaft/bearbeiten" options={{ presentation: "modal" }} />
          <Stack.Screen name="schwangerschaft/woche" />
          <Stack.Screen name="schwangerschaft/geburt" options={{ presentation: "modal" }} />
          <Stack.Screen name="hebamme" />
          <Stack.Screen name="einstellungen" />
        </Stack>
      </FamilyProvider>
    </GestureHandlerRootView>
  );
}
