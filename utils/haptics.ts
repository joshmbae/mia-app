// Kleines, spürbares Feedback beim Tippen — auf Geräten ohne Haptik (Web) still.

import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function tap(): void {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function celebrate(): void {
  if (Platform.OS === "web") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
