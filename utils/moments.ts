// ─── Momente, Messungen & Zeitstrahl ─────────────────────────────────────────

import { Child, GrowthEntry, MomentEntry } from "../types";
import {
  MILESTONES,
  CATEGORY_COLORS,
  CUSTOM_MOMENT_COLOR,
  CUSTOM_MOMENT_EMOJI,
  Milestone,
} from "./milestoneData";
import { getPhaseForDate } from "./developmentPhases";
import { parseISODate, phaseReferenceDate, pregnancyWeek, toISODate } from "./dates";

export function findMilestone(id?: string): Milestone | undefined {
  return id ? MILESTONES.find((m) => m.id === id) : undefined;
}

export function momentTitle(m: MomentEntry): string {
  return m.title || findMilestone(m.milestoneId)?.title || "Ein besonderer Moment";
}

export function momentEmoji(m: MomentEntry): string {
  return m.emoji || findMilestone(m.milestoneId)?.emoji || CUSTOM_MOMENT_EMOJI;
}

export function momentColor(m: MomentEntry): string {
  const ms = findMilestone(m.milestoneId);
  return ms ? CATEGORY_COLORS[ms.category] : CUSTOM_MOMENT_COLOR;
}

// ─── Messwerte ────────────────────────────────────────────────────────────────

export function formatWeight(grams: number): string {
  if (grams < 10000) return `${(grams / 1000).toLocaleString("de-DE", { maximumFractionDigits: 2 })} kg`;
  return `${(grams / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} kg`;
}

export function formatCm(cm: number): string {
  return `${cm.toLocaleString("de-DE", { maximumFractionDigits: 1 })} cm`;
}

/** "74 cm · 8,9 kg" — nur was gemessen wurde */
export function formatMeasurement(g: GrowthEntry): string {
  const parts: string[] = [];
  if (g.heightCm) parts.push(formatCm(g.heightCm));
  if (g.weightGrams) parts.push(formatWeight(g.weightGrams));
  if (g.headCm) parts.push(`Kopf ${formatCm(g.headCm)}`);
  return parts.join(" · ");
}

/** Jüngster Wert je Messgröße (eine Messung muss nicht alles enthalten) */
export function latestValues(entries: GrowthEntry[]): {
  height?: { value: number; on: string };
  weight?: { value: number; on: string };
  head?: { value: number; on: string };
} {
  const out: ReturnType<typeof latestValues> = {};
  for (const e of entries) {
    if (e.heightCm) out.height = { value: e.heightCm, on: e.measuredOn };
    if (e.weightGrams) out.weight = { value: e.weightGrams, on: e.measuredOn };
    if (e.headCm) out.head = { value: e.headCm, on: e.measuredOn };
  }
  return out;
}

// ─── Kapitel ──────────────────────────────────────────────────────────────────

export interface Chapter {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
}

/** In welches Kapitel fällt ein Tag im Leben eines Kindes? */
export function chapterFor(child: Child, dateISO: string): Chapter {
  if (child.kind === "pregnancy") {
    const { week } = pregnancyWeek(child.profile.dueDate, dateISO);
    if (week < 13) return { key: "t1", emoji: "🌱", title: "Erstes Trimester", subtitle: "ab dem positiven Test" };
    if (week < 27) return { key: "t2", emoji: "🌿", title: "Zweites Trimester", subtitle: "ab SSW 13" };
    return { key: "t3", emoji: "🌸", title: "Drittes Trimester", subtitle: "ab SSW 27" };
  }
  const birth = child.profile.birthDate.slice(0, 10);
  if (dateISO < birth) return { key: "before", emoji: "🤰", title: "Bevor du da warst", subtitle: "Im Bauch" };
  const phase = getPhaseForDate(phaseReferenceDate(child.profile), dateISO);
  if (phase) return { key: phase.id, emoji: phase.emoji, title: phase.title, subtitle: phase.ageLabel };
  const years = Math.floor(
    (parseISODate(dateISO).getTime() - parseISODate(birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  return { key: `year-${years}`, emoji: "🎈", title: `${years + 1}. Lebensjahr`, subtitle: `ab ${years} Jahren` };
}

/** Momente nach Kapiteln gruppiert (für das Buch) */
export function buildChapters(child: Child, moments: MomentEntry[]): (Chapter & { moments: MomentEntry[] })[] {
  const chapters: (Chapter & { moments: MomentEntry[] })[] = [];
  for (const m of moments) {
    const c = chapterFor(child, m.happenedOn);
    const last = chapters[chapters.length - 1];
    if (last && last.key === c.key) last.moments.push(m);
    else chapters.push({ ...c, moments: [m] });
  }
  return chapters;
}

// ─── Zeitstrahl ───────────────────────────────────────────────────────────────

export type TimelineItem =
  | { kind: "start"; key: string; dateISO: string }
  | { kind: "chapter"; key: string; chapter: Chapter }
  | { kind: "moment"; key: string; moment: MomentEntry }
  | { kind: "growth"; key: string; entry: GrowthEntry }
  | { kind: "today"; key: string };

/**
 * Der ganze Weg eines Kindes: Start (Geburt bzw. Beginn der Schwangerschaft),
 * Kapitel, Momente und Messungen chronologisch gemischt, am Ende "Heute".
 */
export function buildTimeline(child: Child, moments: MomentEntry[], growth: GrowthEntry[]): TimelineItem[] {
  // Kind: Start ist die Geburt (Schwangerschafts-Momente davor bekommen ein eigenes Kapitel).
  // Schwangerschaft: Start ist der früheste Eintrag oder das Anlegen des Profils.
  const firstMoment = moments[0]?.happenedOn;
  const startISO =
    child.kind === "baby"
      ? child.profile.birthDate.slice(0, 10)
      : [child.profile.createdAt.slice(0, 10), firstMoment].filter((d): d is string => !!d).sort()[0];
  const events: { date: string; order: number; item: TimelineItem }[] = [
    ...moments.map((m) => ({ date: m.happenedOn, order: 1, item: { kind: "moment", key: `m-${m.id}`, moment: m } as TimelineItem })),
    ...growth.map((g) => ({ date: g.measuredOn, order: 2, item: { kind: "growth", key: `g-${g.id}`, entry: g } as TimelineItem })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);

  const items: TimelineItem[] = [];
  const before = events.filter((e) => e.date < startISO);
  const after = events.filter((e) => e.date >= startISO);
  let lastChapter = "";
  const pushEvents = (list: typeof events) => {
    for (const e of list) {
      const c = chapterFor(child, e.date);
      if (c.key !== lastChapter) {
        items.push({ kind: "chapter", key: `c-${c.key}-${e.date}`, chapter: c });
        lastChapter = c.key;
      }
      items.push(e.item);
    }
  };
  pushEvents(before);
  items.push({ kind: "start", key: "start", dateISO: startISO });
  lastChapter = "";
  pushEvents(after);
  items.push({ kind: "today", key: "today" });
  return items;
}

/** Fotos aller Momente, neueste zuerst */
export function allPhotos(moments: MomentEntry[]): string[] {
  return [...moments].reverse().flatMap((m) => m.photos);
}

/** Momente, die genau heute vor einem oder mehreren Jahren passiert sind */
export function onThisDay(moments: MomentEntry[]): MomentEntry[] {
  const today = toISODate(new Date()).slice(5);
  const year = new Date().getFullYear().toString();
  return moments.filter((m) => m.happenedOn.slice(5) === today && !m.happenedOn.startsWith(year));
}
