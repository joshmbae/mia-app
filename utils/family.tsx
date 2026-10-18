// ─── Familie: alle Kinder und das gerade gewählte ────────────────────────────
// Die App ist kindzentriert: Es gibt immer genau ein aktives Kind (oder eine
// Schwangerschaft). Die Auswahl wird auf dem Gerät gemerkt.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BabyProfile, Child, PregnancyProfile } from "../types";
import { loadBabies, loadPregnancies } from "./storage";
import { supabase } from "./supabase";

const ACTIVE_KEY = "mia_active_child";

export function babyChild(p: BabyProfile): Child {
  return { kind: "baby", id: p.id, name: p.name, color: p.avatarColor, profile: p };
}

export function pregnancyChild(p: PregnancyProfile): Child {
  return { kind: "pregnancy", id: p.id, name: p.nickname, color: p.avatarColor, profile: p };
}

interface FamilyContextValue {
  children: Child[];
  active: Child | null;
  loaded: boolean;
  error: string | null;
  setActive: (id: string) => void;
  refresh: (preferId?: string) => Promise<void>;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children: node }: { children: React.ReactNode }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setActive = useCallback((id: string) => {
    setActiveId(id);
    AsyncStorage.setItem(ACTIVE_KEY, id).catch(() => {});
  }, []);

  const refresh = useCallback(async (preferId?: string) => {
    try {
      const [babies, pregnancies] = await Promise.all([loadBabies(), loadPregnancies()]);
      const list = [...babies.map(babyChild), ...pregnancies.map(pregnancyChild)];
      setChildren(list);
      const stored = preferId ?? (await AsyncStorage.getItem(ACTIVE_KEY).catch(() => null));
      setActiveId((current) => {
        const wanted = preferId ?? current ?? stored;
        const next = list.find((c) => c.id === wanted)?.id ?? list[0]?.id ?? null;
        if (next) AsyncStorage.setItem(ACTIVE_KEY, next).catch(() => {});
        return next;
      });
      setError(null);
    } catch (err) {
      setError("Die Daten konnten gerade nicht geladen werden. Bitte prüfe deine Verbindung.");
    } finally {
      setLoaded(true);
    }
  }, []);

  // Beim Start (mit bestehender Sitzung) und nach jedem Login laden; nach dem
  // Logout alles vergessen. So funktionieren auch direkt geöffnete Unterseiten.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) refresh();
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Supabase empfiehlt, im Callback keine weiteren Supabase-Aufrufe direkt zu starten
      if (event === "SIGNED_IN") setTimeout(() => refresh(), 0);
      if (event === "SIGNED_OUT") {
        setChildren([]);
        setActiveId(null);
        setLoaded(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const value = useMemo<FamilyContextValue>(
    () => ({
      children,
      active: children.find((c) => c.id === activeId) ?? null,
      loaded,
      error,
      setActive,
      refresh,
    }),
    [children, activeId, loaded, error, setActive, refresh]
  );

  return <FamilyContext.Provider value={value}>{node}</FamilyContext.Provider>;
}

/** Das Kind aus einem Routen-Parameter — oder, ohne Parameter, das aktive Kind */
export function useChild(id?: string): Child | null {
  const { children, active } = useFamily();
  if (id) return children.find((c) => c.id === id) ?? null;
  return active;
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily muss innerhalb von FamilyProvider verwendet werden");
  return ctx;
}
