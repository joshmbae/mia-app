// ─── Datum & Alter ───────────────────────────────────────────────────────────
// Alle Tagesangaben ("2025-03-01") werden in lokaler Zeit behandelt, damit ein
// Moment nicht durch Zeitzonen auf den Vortag rutscht.

import { BabyProfile } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** "2025-03-01" für ein Date — in lokaler Zeit, nicht UTC */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Liest "2025-03-01" oder einen vollen ISO-Zeitstempel als lokalen Kalendertag */
export function parseISODate(iso: string): Date {
  if (iso.length > 10) {
    const d = new Date(iso);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((parseISODate(toISO).getTime() - parseISODate(fromISO).getTime()) / DAY_MS);
}

/** "12. März 2026" */
export function formatDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

/** "12. März" (im laufenden Jahr) bzw. "12. März 2025" */
export function formatDateShort(iso: string): string {
  const d = parseISODate(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("de-DE", sameYear ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" });
}

/** "MÄR" — für kleine Kalender-Kacheln */
export function formatMonthTag(iso: string): string {
  return parseISODate(iso).toLocaleDateString("de-DE", { month: "short" }).replace(".", "").toUpperCase();
}

/** Ganze Monate zwischen zwei Tagen (Kalenderlogik) */
function monthsBetween(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months--;
  return months;
}

/** Alter heute in freundlicher Form: "5 Tage", "3 Wochen", "10 Monate & 1 Woche", "2 Jahre & 3 Monate" */
export function ageText(birthISO: string, atISO: string = todayISO()): string {
  const birth = parseISODate(birthISO);
  const at = parseISODate(atISO);
  const days = Math.round((at.getTime() - birth.getTime()) / DAY_MS);
  if (days < 0) return "noch nicht geboren";
  if (days === 0) return "heute geboren";
  if (days < 14) return `${days} ${days === 1 ? "Tag" : "Tage"}`;
  if (days < 9 * 7) {
    const w = Math.floor(days / 7);
    return `${w} Wochen`;
  }
  const months = monthsBetween(birth, at);
  if (months < 24) {
    const anchor = new Date(birth.getFullYear(), birth.getMonth() + months, birth.getDate());
    const weeks = Math.floor((at.getTime() - anchor.getTime()) / (7 * DAY_MS));
    const m = `${months} ${months === 1 ? "Monat" : "Monate"}`;
    return weeks > 0 ? `${m} & ${weeks} ${weeks === 1 ? "Woche" : "Wochen"}` : m;
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = `${years} Jahre`;
  return rest > 0 ? `${y} & ${rest} ${rest === 1 ? "Monat" : "Monate"}` : y;
}

/** Alter an einem Datum im Dativ: "mit 4 Monaten", "am Tag der Geburt", "in SSW 20" */
export function ageAtDate(birthISO: string, atISO: string): string {
  const birth = parseISODate(birthISO);
  const at = parseISODate(atISO);
  const days = Math.round((at.getTime() - birth.getTime()) / DAY_MS);
  if (days < 0) {
    const ssw = Math.max(1, 40 - Math.ceil(-days / 7));
    return `in SSW ${ssw}`;
  }
  if (days === 0) return "am Tag der Geburt";
  if (days < 14) return `mit ${days} ${days === 1 ? "Tag" : "Tagen"}`;
  if (days < 9 * 7) return `mit ${Math.floor(days / 7)} Wochen`;
  const months = monthsBetween(birth, at);
  if (months < 24) return `mit ${months} ${months === 1 ? "Monat" : "Monaten"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest > 0
    ? `mit ${years} Jahren und ${rest} ${rest === 1 ? "Monat" : "Monaten"}`
    : `mit ${years} Jahren`;
}

/**
 * Bezugsdatum für Phasen: bei Frühchen der errechnete Termin (korrigiertes
 * Alter, üblich bis etwa zum 2. Geburtstag), sonst der Geburtstag.
 */
export function phaseReferenceDate(baby: BabyProfile): string {
  if (baby.premature && baby.dueDate) {
    const corrected = daysBetween(baby.dueDate, todayISO());
    if (corrected < 730) return baby.dueDate;
  }
  return baby.birthDate;
}

/** Schwangerschaftswoche aus dem errechneten Termin: { week, day } (SSW 1–42) */
export function pregnancyWeek(dueISO: string, atISO: string = todayISO()): { week: number; day: number } {
  const daysPregnant = 280 - daysBetween(atISO, dueISO);
  const clamped = Math.max(0, Math.min(42 * 7, daysPregnant));
  return { week: Math.floor(clamped / 7), day: clamped % 7 };
}

export function daysUntil(iso: string): number {
  return daysBetween(todayISO(), iso);
}
