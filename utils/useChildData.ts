import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { GrowthEntry, MomentEntry } from "../types";
import { loadGrowth, loadMoments } from "./storage";

/** Momente und Messungen eines Kindes; lädt neu, sobald der Screen in den Fokus kommt */
export function useChildData(childId: string | undefined) {
  const [moments, setMoments] = useState<MomentEntry[]>([]);
  const [growth, setGrowth] = useState<GrowthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!childId) {
      setMoments([]);
      setGrowth([]);
      setLoading(false);
      return;
    }
    try {
      const [m, g] = await Promise.all([loadMoments(childId), loadGrowth(childId)]);
      setMoments(m);
      setGrowth(g);
      setError(null);
    } catch {
      setError("Konnte gerade nicht laden. Zieh nach unten oder versuch es gleich noch einmal.");
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      reload();
    }, [reload])
  );

  return { moments, growth, loading, error, reload };
}
