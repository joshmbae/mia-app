import { Platform } from "react-native";
import { File } from "expo-file-system";
import { supabase } from "./supabase";
import { BabyProfile, PregnancyProfile, MomentEntry, GrowthEntry } from "../types";

// Row-Level-Security beschränkt jede Abfrage auf den eingeloggten Familien-Account.
// Alle Funktionen hier lesen/schreiben einzelne Zeilen; Fehler werden geworfen,
// damit die Screens sie anzeigen können.

export function newId(): string {
  return `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Kinder ───────────────────────────────────────────────────────────────────

function babyToRow(p: BabyProfile) {
  return {
    id: p.id,
    name: p.name,
    birth_date: p.birthDate,
    due_date: p.dueDate ?? null,
    gender: p.gender ?? null,
    feeding_type: p.feedingType ?? null,
    avatar_color: p.avatarColor,
    created_at: p.createdAt,
    photo_uri: p.photoUri ?? null,
    weight_grams: p.weightGrams ?? null,
    premature: p.premature ?? null,
    siblings: p.siblings ?? null,
    medical_notes: p.medicalNotes ?? null,
    description: p.description ?? null,
  };
}

function rowToBaby(r: any): BabyProfile {
  return {
    id: r.id,
    name: r.name,
    birthDate: r.birth_date,
    dueDate: r.due_date ?? undefined,
    gender: r.gender ?? undefined,
    feedingType: r.feeding_type ?? undefined,
    avatarColor: r.avatar_color,
    createdAt: r.created_at,
    photoUri: r.photo_uri ?? undefined,
    weightGrams: r.weight_grams ?? undefined,
    premature: r.premature ?? undefined,
    siblings: r.siblings ?? undefined,
    medicalNotes: r.medical_notes ?? undefined,
    description: r.description ?? undefined,
  };
}

export async function loadBabies(): Promise<BabyProfile[]> {
  const { data, error } = await supabase.from("baby_profiles").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToBaby).sort((a, b) => a.birthDate.localeCompare(b.birthDate));
}

export async function saveBaby(p: BabyProfile): Promise<void> {
  const { error } = await supabase.from("baby_profiles").upsert(babyToRow(p));
  if (error) throw error;
}

/** Löscht ein Kind samt Tagebuch, Fotos und Messungen */
export async function deleteBaby(baby: BabyProfile): Promise<void> {
  const moments = await loadMoments(baby.id);
  await deletePhotos([...moments.flatMap((m) => m.photos), ...(baby.photoUri ? [baby.photoUri] : [])]);
  await supabase.from("moment_entries").delete().eq("baby_id", baby.id);
  await supabase.from("growth_entries").delete().eq("baby_id", baby.id);
  const { error } = await supabase.from("baby_profiles").delete().eq("id", baby.id);
  if (error) throw error;
}

// ─── Schwangerschaften ────────────────────────────────────────────────────────

function pregnancyToRow(p: PregnancyProfile) {
  return {
    id: p.id,
    nickname: p.nickname,
    due_date: p.dueDate,
    avatar_color: p.avatarColor,
    created_at: p.createdAt,
    description: p.description ?? null,
  };
}

function rowToPregnancy(r: any): PregnancyProfile {
  return {
    id: r.id,
    nickname: r.nickname,
    dueDate: r.due_date,
    avatarColor: r.avatar_color,
    createdAt: r.created_at,
    description: r.description ?? undefined,
  };
}

export async function loadPregnancies(): Promise<PregnancyProfile[]> {
  const { data, error } = await supabase.from("pregnancy_profiles").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToPregnancy).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function savePregnancy(p: PregnancyProfile): Promise<void> {
  const { error } = await supabase.from("pregnancy_profiles").upsert(pregnancyToRow(p));
  if (error) throw error;
}

export async function deletePregnancy(id: string): Promise<void> {
  const moments = await loadMoments(id);
  await deletePhotos(moments.flatMap((m) => m.photos));
  await supabase.from("moment_entries").delete().eq("baby_id", id);
  const { error } = await supabase.from("pregnancy_profiles").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Das Baby ist da: legt das Kind an, nimmt alle Momente aus der
 * Schwangerschaft mit ins Tagebuch und speichert Geburtsgröße/-gewicht
 * als erste Messung.
 */
export async function convertPregnancyToBaby(
  pregnancyId: string,
  baby: BabyProfile,
  birthMeasurement?: { heightCm?: number; weightGrams?: number; headCm?: number }
): Promise<void> {
  await saveBaby(baby);
  const { error } = await supabase
    .from("moment_entries")
    .update({ baby_id: baby.id })
    .eq("baby_id", pregnancyId);
  if (error) throw error;
  if (birthMeasurement && (birthMeasurement.heightCm || birthMeasurement.weightGrams || birthMeasurement.headCm)) {
    await saveGrowthEntry({
      id: newId(),
      babyId: baby.id,
      measuredOn: baby.birthDate.slice(0, 10),
      ...birthMeasurement,
      note: "Geburt",
      createdAt: new Date().toISOString(),
    });
  }
  await supabase.from("pregnancy_profiles").delete().eq("id", pregnancyId);
}

// ─── Tagebuch-Momente ─────────────────────────────────────────────────────────

function momentToRow(m: MomentEntry) {
  return {
    baby_id: m.babyId,
    id: m.id,
    milestone_id: m.milestoneId ?? null,
    title: m.title,
    emoji: m.emoji ?? null,
    happened_on: m.happenedOn,
    note: m.note ?? null,
    photos: m.photos,
    created_at: m.createdAt,
  };
}

function rowToMoment(r: any): MomentEntry {
  return {
    id: r.id,
    babyId: r.baby_id,
    milestoneId: r.milestone_id ?? undefined,
    title: r.title,
    emoji: r.emoji ?? undefined,
    happenedOn: r.happened_on,
    note: r.note ?? undefined,
    photos: r.photos ?? [],
    createdAt: r.created_at,
  };
}

/** Alle Momente eines Kindes, chronologisch (ältester zuerst) */
export async function loadMoments(babyId: string): Promise<MomentEntry[]> {
  const { data, error } = await supabase.from("moment_entries").select("*").eq("baby_id", babyId);
  if (error) throw error;
  return (data ?? [])
    .map(rowToMoment)
    .sort((a, b) => a.happenedOn.localeCompare(b.happenedOn) || a.createdAt.localeCompare(b.createdAt));
}

export async function loadMoment(babyId: string, id: string): Promise<MomentEntry | null> {
  const { data, error } = await supabase
    .from("moment_entries")
    .select("*")
    .eq("baby_id", babyId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToMoment(data) : null;
}

export async function saveMoment(entry: MomentEntry): Promise<void> {
  const { error } = await supabase.from("moment_entries").upsert(momentToRow(entry));
  if (error) throw error;
}

export async function deleteMoment(entry: MomentEntry): Promise<void> {
  const { error } = await supabase
    .from("moment_entries")
    .delete()
    .eq("baby_id", entry.babyId)
    .eq("id", entry.id);
  if (error) throw error;
  await deletePhotos(entry.photos);
}

// ─── Wachstum ─────────────────────────────────────────────────────────────────

function growthToRow(g: GrowthEntry) {
  return {
    baby_id: g.babyId,
    id: g.id,
    measured_on: g.measuredOn,
    height_cm: g.heightCm ?? null,
    weight_grams: g.weightGrams ?? null,
    head_cm: g.headCm ?? null,
    note: g.note ?? null,
    created_at: g.createdAt,
  };
}

function rowToGrowth(r: any): GrowthEntry {
  return {
    id: r.id,
    babyId: r.baby_id,
    measuredOn: r.measured_on,
    heightCm: r.height_cm ?? undefined,
    weightGrams: r.weight_grams ?? undefined,
    headCm: r.head_cm ?? undefined,
    note: r.note ?? undefined,
    createdAt: r.created_at,
  };
}

/** Alle Messungen eines Kindes, chronologisch */
export async function loadGrowth(babyId: string): Promise<GrowthEntry[]> {
  const { data, error } = await supabase.from("growth_entries").select("*").eq("baby_id", babyId);
  if (error) throw error;
  return (data ?? [])
    .map(rowToGrowth)
    .sort((a, b) => a.measuredOn.localeCompare(b.measuredOn) || a.createdAt.localeCompare(b.createdAt));
}

export async function saveGrowthEntry(entry: GrowthEntry): Promise<void> {
  const { error } = await supabase.from("growth_entries").upsert(growthToRow(entry));
  if (error) throw error;
}

export async function deleteGrowthEntry(entry: GrowthEntry): Promise<void> {
  const { error } = await supabase
    .from("growth_entries")
    .delete()
    .eq("baby_id", entry.babyId)
    .eq("id", entry.id);
  if (error) throw error;
}

// ─── Fotos (Supabase Storage) ─────────────────────────────────────────────────
// Fotos landen im privaten Bucket "moment-photos" unter <user_id>/…, damit die
// ganze Familie sie auf jedem Gerät sieht. Gespeichert wird nur eine Referenz
// "storage:<pfad>"; angezeigt wird über signierte URLs. Klappt der Upload nicht
// (z. B. offline), bleibt die lokale URI als Rückfall.

const PHOTO_BUCKET = "moment-photos";
const STORAGE_PREFIX = "storage:";
const SIGNED_URL_SECONDS = 60 * 60;

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export function isStoredPhoto(ref: string): boolean {
  return ref.startsWith(STORAGE_PREFIX);
}

async function readImageBytes(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === "web") return (await fetch(uri)).arrayBuffer();
  const bytes = await new File(uri).bytes();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** Lädt ein lokal ausgewähltes Foto hoch und gibt die zu speichernde Referenz zurück */
export async function uploadPhoto(folder: string, uri: string): Promise<string> {
  if (isStoredPhoto(uri)) return uri;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Nicht eingeloggt");
    const path = `${user.id}/${folder}/${newId()}.jpg`;
    const body = await readImageBytes(uri);
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, body, { contentType: "image/jpeg" });
    if (error) throw error;
    return STORAGE_PREFIX + path;
  } catch (err) {
    console.warn("Foto-Upload fehlgeschlagen, nutze lokale Datei", err);
    return uri;
  }
}

/** Löst Foto-Referenzen in anzeigbare URLs auf (signierte URLs für Storage-Fotos) */
export async function resolvePhotoUrls(refs: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const now = Date.now();
  const missing: string[] = [];
  for (const ref of new Set(refs)) {
    if (!isStoredPhoto(ref)) {
      result[ref] = ref;
      continue;
    }
    const cached = signedUrlCache.get(ref);
    if (cached && cached.expiresAt > now + 60_000) result[ref] = cached.url;
    else missing.push(ref);
  }
  if (missing.length > 0) {
    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(missing.map((r) => r.slice(STORAGE_PREFIX.length)), SIGNED_URL_SECONDS);
    if (!error && data) {
      data.forEach((d, i) => {
        if (!d.signedUrl) return;
        result[missing[i]] = d.signedUrl;
        signedUrlCache.set(missing[i], { url: d.signedUrl, expiresAt: now + SIGNED_URL_SECONDS * 1000 });
      });
    }
  }
  return result;
}

export async function deletePhotos(refs: string[]): Promise<void> {
  const paths = refs.filter(isStoredPhoto).map((r) => r.slice(STORAGE_PREFIX.length));
  if (paths.length === 0) return;
  await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  for (const p of paths) signedUrlCache.delete(STORAGE_PREFIX + p);
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Foto als data:-URI (für den Buch-Export, der keine Netzwerk-/Datei-URLs laden kann) */
export async function photoDataUri(ref: string): Promise<string | null> {
  try {
    if (isStoredPhoto(ref)) {
      const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(ref.slice(STORAGE_PREFIX.length));
      if (error || !data) return null;
      return blobToDataUri(data);
    }
    if (Platform.OS === "web" || /^(https?|blob):/.test(ref)) return blobToDataUri(await (await fetch(ref)).blob());
    return `data:image/jpeg;base64,${await new File(ref).base64()}`;
  } catch {
    return null;
  }
}
