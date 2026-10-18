import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import PregnancyForm from "../../components/PregnancyForm";
import { Screen } from "../../components/ui/Screen";
import { useFamily } from "../../utils/family";
import { colors } from "../../utils/theme";

export default function EditPregnancyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { children, loaded, refresh } = useFamily();
  const found = children.some((c) => c.id === id);

  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  if (!found) {
    return (
      <Screen>
        <ActivityIndicator color={colors.coral} style={{ marginTop: 80 }} />
      </Screen>
    );
  }
  return <PregnancyForm key={id} editId={id} />;
}
