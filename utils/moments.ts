// ─── Helfer rund um Tagebuch-Momente ─────────────────────────────────────────

import { MomentEntry } from "../types";
import {
  MILESTONES,
  CATEGORY_COLORS,
  CUSTOM_MOMENT_COLOR,
  CUSTOM_MOMENT_EMOJI,
  Milestone,
} from "./milestoneData";
import { getPhaseForDate } from "./developmentPhases";

const DAY_MS = 24 * 60 * 60 * 1000;

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

/** "2025-03-01" für ein Date — in lokaler Zeit, nicht UTC */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatMomentDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

/** Alter des Kindes an einem Datum, z. B. "mit 4 Monaten", "am Tag der Geburt" */
export function ageAtDate(birthDateISO: string, dateISO: string): string {
  const birth = parseISODate(birthDateISO);
  const date = parseISODate(dateISO);
  const days = Math.round((date.getTime() - birth.getTime()) / DAY_MS);
  if (days < 0) return "vor der Geburt";
  if (days === 0) return "am Tag der Geburt";
  if (days < 14) return `mit ${days} ${days === 1 ? "Tag" : "Tagen"}`;
  if (days < 9 * 7) {
    const w = Math.floor(days / 7);
    return `mit ${w} Wochen`;
  }
  let months = (date.getFullYear() - birth.getFullYear()) * 12 + (date.getMonth() - birth.getMonth());
  if (date.getDate() < birth.getDate()) months--;
  if (months < 24) return `mit ${months} ${months === 1 ? "Monat" : "Monaten"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearText = `${years} Jahren`;
  return rest > 0 ? `mit ${yearText} und ${rest} ${rest === 1 ? "Monat" : "Monaten"}` : `mit ${yearText}`;
}

export interface TimelineChapter {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  moments: MomentEntry[];
}

/**
 * Gruppiert Momente zu Kapiteln fürs Leben: in den ersten drei Jahren nach
 * Entwicklungsphasen, danach nach Lebensjahren. Nur Kapitel mit Momenten.
 */
export function buildChapters(birthDateISO: string, moments: MomentEntry[]): TimelineChapter[] {
  const chapters: TimelineChapter[] = [];
  for (const m of moments) {
    const phase = getPhaseForDate(birthDateISO, m.happenedOn);
    let key: string, emoji: string, title: string, subtitle: string;
    if (phase) {
      key = phase.id;
      emoji = phase.emoji;
      title = phase.title;
      subtitle = phase.ageLabel;
    } else if (m.happenedOn < birthDateISO.slice(0, 10)) {
      key = "before";
      emoji = "🤰";
      title = "Bevor du da warst";
      subtitle = "Schwangerschaft";
    } else {
      const years = Math.floor(
        (parseISODate(m.happenedOn).getTime() - parseISODate(birthDateISO).getTime()) / (365.25 * DAY_MS)
      );
      key = `year-${years}`;
      emoji = "🎈";
      title = `${years + 1}. Lebensjahr`;
      subtitle = `${years} Jahre`;
    }
    const last = chapters[chapters.length - 1];
    if (last && last.key === key) last.moments.push(m);
    else chapters.push({ key, emoji, title, subtitle, moments: [m] });
  }
  return chapters;
}
