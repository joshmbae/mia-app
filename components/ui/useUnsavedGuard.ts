// ─── Schutz vor Verlust ungespeicherter Eingaben ─────────────────────────────
// Solange ein Formular geändert, aber nicht gespeichert ist, fragt die App
// beim Schließen (X, Zurück, Wischgeste) nach, ob verworfen werden soll.
// Nach dem Speichern `dirty` auf false setzen, bevor navigiert wird.

import { Alert, Platform } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";

export function useUnsavedGuard(dirty: boolean): void {
  const navigation = useNavigation();
  usePreventRemove(dirty, ({ data }) => {
    const leave = () => navigation.dispatch(data.action);
    if (Platform.OS === "web") {
      if (window.confirm("Änderungen verwerfen?")) leave();
      return;
    }
    Alert.alert("Änderungen verwerfen?", "Was du eingetragen hast, ist noch nicht gespeichert.", [
      { text: "Weiter bearbeiten", style: "cancel" },
      { text: "Verwerfen", style: "destructive", onPress: leave },
    ]);
  });
}
