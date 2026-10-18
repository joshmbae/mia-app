// ─── Barrierefreiheit: reduzierte Bewegung & Ansagen ─────────────────────────

import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** true, wenn im System "Bewegung reduzieren" aktiv ist */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/** Kurze Ansage für Screenreader (z. B. "Moment gespeichert") */
export function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}
