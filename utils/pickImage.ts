// ─── Fotos auswählen: Galerie (auch mehrere) oder Kamera ─────────────────────

import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

async function fromGallery(limit: number, square: boolean): Promise<string[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Kein Zugriff auf Fotos", "Bitte erlaube Mia den Zugriff auf deine Fotos in den Einstellungen.");
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    allowsEditing: square && limit === 1,
    aspect: square ? [1, 1] : undefined,
    quality: 0.75,
  });
  return result.canceled ? [] : result.assets.map((a) => a.uri);
}

async function fromCamera(square: boolean): Promise<string[]> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Kein Zugriff auf die Kamera", "Bitte erlaube Mia die Kamera in den Einstellungen.");
    return [];
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: square,
    aspect: square ? [1, 1] : undefined,
    quality: 0.75,
  });
  return result.canceled ? [] : [result.assets[0].uri];
}

/**
 * Fragt nach Kamera oder Galerie und gibt die gewählten lokalen URIs zurück.
 * `square` schneidet quadratisch zu (für Profilbilder).
 */
export function pickImages({ limit = 1, square = false }: { limit?: number; square?: boolean } = {}): Promise<string[]> {
  if (Platform.OS === "web") return fromGallery(limit, square);
  return new Promise((resolve) => {
    Alert.alert("Foto hinzufügen", undefined, [
      { text: "Kamera", onPress: () => fromCamera(square).then(resolve) },
      { text: "Aus der Galerie", onPress: () => fromGallery(limit, square).then(resolve) },
      { text: "Abbrechen", style: "cancel", onPress: () => resolve([]) },
    ]);
  });
}
