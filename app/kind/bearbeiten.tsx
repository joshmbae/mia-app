import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ChildForm from "../../components/ChildForm";
import { Screen } from "../../components/ui/Screen";
import { useFamily } from "../../utils/family";
import { colors } from "../../utils/theme";

export default function EditChildScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { children, loaded, refresh } = useFamily();
  const found = children.some((c) => c.id === id);

  useEffect(() => {
    if (!loaded) refresh();
  }, [loaded, refresh]);

  // Formular erst zeigen, wenn das Kind geladen ist (es liest seine Startwerte einmalig)
  if (!found) {
    return (
      <Screen>
        <ActivityIndicator color={colors.coral} style={{ marginTop: 80 }} />
      </Screen>
    );
  }
  return <ChildForm key={id} editId={id} />;
}
