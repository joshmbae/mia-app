import { useEffect } from "react";
import { Tabs } from "expo-router";
import { TabBar } from "../../components/ui/TabBar";
import { useFamily } from "../../utils/family";
import { colors } from "../../utils/theme";

export default function TabsLayout() {
  const { loaded, refresh } = useFamily();

  // Direkter Einstieg (z. B. Web-Reload auf einem Tab): Familie nachladen
  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="start" />
      <Tabs.Screen name="zeitstrahl" />
      <Tabs.Screen name="wachstum" />
      <Tabs.Screen name="buch" />
    </Tabs>
  );
}
