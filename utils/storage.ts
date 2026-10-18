import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { File } from "expo-file-system";
import { supabase } from "./supabase";
import { BabyProfile, ParentProfile, PregnancyProfile, ChatMessage, ChatSession, Memory, WeightLog, FeedingLog, SleepLog, MomentEntry } from "../types";

// ─── Generic reconcile helper ─────────────────────────────────────────────────
// Row-Level-Security already scopes every query to the logged-in user, so these
// functions only need to reconcile a table (or a baby/session-scoped slice of a
// table) against the full array the caller wants to persist: upsert what's given,
// delete whatever existing row isn't in that array anymore.

async function reconcile(
  table: string,
  scope: [string, string] | null,
  idColumn: string,
  ids: string[],
  rows: Record<string, unknown>[]
): Promise<void> {
  let selectQuery = supabase.from(table).select(idColumn);
  if (scope) selectQuery = selectQuery.eq(scope[0], scope[1]);
  const { data: existing, error: selErr } = await selectQuery;
  if (selErr) throw selErr;

  const existingIds = new Set((existing ?? []).map((r: any) => r[idColumn] as string));
  const idSet = new Set(ids);
  const toDelete = [...existingIds].filter((existingId) => !idSet.has(existingId));

  if (toDelete.length > 0) {
    let delQuery = supabase.from(table).delete();
    if (scope) delQuery = delQuery.eq(scope[0], scope[1]);
    const { error } = await delQuery.in(idColumn, toDelete);
    if (error) throw error;
  }

  if (rows.length > 0) {
    const { error } = await supabase.from(table).upsert(rows);
    if (error) throw error;
  }
}

// ─── Baby Profiles ────────────────────────────────────────────────────────────

function babyProfileToRow(p: BabyProfile) {
  return {
    id: p.id,
    name: p.name,
    birth_date: p.birthDate,
    due_date: p.dueDate ?? null,
    gender: p.gender ?? null,
    feeding_type: p.feedingType,
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

function rowToBabyProfile(r: any): BabyProfile {
  return {
    id: r.id,
    name: r.name,
    birthDate: r.birth_date,
    dueDate: r.due_date ?? undefined,
    gender: r.gender ?? undefined,
    feedingType: r.feeding_type,
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

export async function saveProfiles(profiles: BabyProfile[]): Promise<void> {
  await reconcile("baby_profiles", null, "id", profiles.map((p) => p.id), profiles.map(babyProfileToRow));
}

export async function loadProfiles(): Promise<BabyProfile[]> {
  const { data, error } = await supabase.from("baby_profiles").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToBabyProfile);
}

// ─── Parent Profiles ──────────────────────────────────────────────────────────

function parentProfileToRow(p: ParentProfile) {
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    created_at: p.createdAt,
    description: p.description ?? null,
  };
}

function rowToParentProfile(r: any): ParentProfile {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    createdAt: r.created_at,
    description: r.description ?? undefined,
  };
}

export async function saveParentProfiles(profiles: ParentProfile[]): Promise<void> {
  await reconcile("parent_profiles", null, "id", profiles.map((p) => p.id), profiles.map(parentProfileToRow));
}

export async function loadParentProfiles(): Promise<ParentProfile[]> {
  const { data, error } = await supabase.from("parent_profiles").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToParentProfile);
}

// ─── Pregnancy Profiles ───────────────────────────────────────────────────────

function pregnancyProfileToRow(p: PregnancyProfile) {
  return {
    id: p.id,
    nickname: p.nickname,
    due_date: p.dueDate,
    avatar_color: p.avatarColor,
    created_at: p.createdAt,
    description: p.description ?? null,
  };
}

function rowToPregnancyProfile(r: any): PregnancyProfile {
  return {
    id: r.id,
    nickname: r.nickname,
    dueDate: r.due_date,
    avatarColor: r.avatar_color,
    createdAt: r.created_at,
    description: r.description ?? undefined,
  };
}

export async function savePregnancyProfiles(profiles: PregnancyProfile[]): Promise<void> {
  await reconcile("pregnancy_profiles", null, "id", profiles.map((p) => p.id), profiles.map(pregnancyProfileToRow));
}

export async function loadPregnancyProfiles(): Promise<PregnancyProfile[]> {
  const { data, error } = await supabase.from("pregnancy_profiles").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToPregnancyProfile);
}

export async function migratePregnancyToBaby(
  pregnancyId: string,
  babyData: Omit<BabyProfile, "id" | "createdAt">
): Promise<BabyProfile> {
  const newBaby: BabyProfile = {
    ...babyData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };

  // Save new baby profile
  const babies = await loadProfiles();
  await saveProfiles([...babies, newBaby]);

  // Migrate sessions: move to new baby ID, update babyId field (in place, same session id)
  const sessions = await loadSessions(pregnancyId);
  const updatedSessions = sessions.map((s) => ({ ...s, babyId: newBaby.id }));
  await saveSessions(newBaby.id, updatedSessions);

  // Migrate memories: composite key includes baby_id, so old rows must be deleted explicitly
  const memories = await loadMemories(pregnancyId);
  const updatedMemories = memories.map((m) => ({ ...m, babyId: newBaby.id }));
  await saveMemories(newBaby.id, updatedMemories);
  await supabase.from("memories").delete().eq("baby_id", pregnancyId);

  // Remove pregnancy profile (sessions/memories already moved, don't delete them)
  const pregnancies = await loadPregnancyProfiles();
  await savePregnancyProfiles(pregnancies.filter((p) => p.id !== pregnancyId));

  return newBaby;
}

export async function deletePregnancyProfile(id: string): Promise<void> {
  const profiles = await loadPregnancyProfiles();
  await savePregnancyProfiles(profiles.filter((p) => p.id !== id));
  const sessions = await loadSessions(id);
  if (sessions.length > 0) {
    await supabase.from("chat_messages").delete().in("session_id", sessions.map((s) => s.id));
  }
  await supabase.from("chat_sessions").delete().eq("baby_id", id);
  await supabase.from("memories").delete().eq("baby_id", id);
}

// ─── Chat Sessions ────────────────────────────────────────────────────────────

function chatSessionToRow(babyId: string, s: ChatSession) {
  return {
    id: s.id,
    baby_id: babyId,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    preview: s.preview,
  };
}

function rowToChatSession(r: any): ChatSession {
  return {
    id: r.id,
    babyId: r.baby_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    preview: r.preview,
  };
}

export async function loadSessions(babyId: string): Promise<ChatSession[]> {
  const { data, error } = await supabase.from("chat_sessions").select("*").eq("baby_id", babyId);
  if (error) throw error;
  return (data ?? []).map(rowToChatSession);
}

export async function saveSessions(babyId: string, sessions: ChatSession[]): Promise<void> {
  await reconcile(
    "chat_sessions",
    ["baby_id", babyId],
    "id",
    sessions.map((s) => s.id),
    sessions.map((s) => chatSessionToRow(babyId, s))
  );
}

export async function createSession(babyId: string): Promise<ChatSession> {
  const session: ChatSession = {
    id: Date.now().toString(),
    babyId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preview: "Neues Gespräch",
  };
  const existing = await loadSessions(babyId);
  await saveSessions(babyId, [session, ...existing]);
  return session;
}

export async function updateSessionPreview(
  babyId: string,
  sessionId: string,
  preview: string
): Promise<void> {
  const sessions = await loadSessions(babyId);
  const updated = sessions.map((s) =>
    s.id === sessionId ? { ...s, preview, updatedAt: new Date().toISOString() } : s
  );
  await saveSessions(babyId, updated);
}

export async function deleteSession(babyId: string, sessionId: string): Promise<void> {
  const sessions = await loadSessions(babyId);
  await saveSessions(babyId, sessions.filter((s) => s.id !== sessionId));
  await supabase.from("chat_messages").delete().eq("session_id", sessionId);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

function chatMessageToRow(sessionId: string, m: ChatMessage) {
  return {
    session_id: sessionId,
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  };
}

function rowToChatMessage(r: any): ChatMessage {
  return {
    id: r.id,
    role: r.role,
    content: r.content,
    timestamp: r.timestamp,
  };
}

export async function saveMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
  await reconcile(
    "chat_messages",
    ["session_id", sessionId],
    "id",
    messages.map((m) => m.id),
    messages.map((m) => chatMessageToRow(sessionId, m))
  );
}

export async function loadMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase.from("chat_messages").select("*").eq("session_id", sessionId);
  if (error) throw error;
  return (data ?? []).map(rowToChatMessage);
}

export async function deleteProfile(id: string): Promise<void> {
  // Remove profile
  const profiles = await loadProfiles();
  await saveProfiles(profiles.filter((p) => p.id !== id));
  // Remove all sessions + their messages
  const sessions = await loadSessions(id);
  if (sessions.length > 0) {
    await supabase.from("chat_messages").delete().in("session_id", sessions.map((s) => s.id));
  }
  await supabase.from("chat_sessions").delete().eq("baby_id", id);
  // Remove memories, weight/feeding/sleep logs, milestones
  await supabase.from("memories").delete().eq("baby_id", id);
  await supabase.from("weight_logs").delete().eq("baby_id", id);
  await supabase.from("feeding_logs").delete().eq("baby_id", id);
  await supabase.from("sleep_logs").delete().eq("baby_id", id);
  const moments = await loadMoments(id);
  await deleteMomentPhotos(moments.flatMap((m) => m.photos));
  await supabase.from("moment_entries").delete().eq("baby_id", id);
  await supabase.from("milestone_progress").delete().eq("baby_id", id); // Altbestand
  // Active timer is ephemeral, device-local UI state — stays in AsyncStorage
  await AsyncStorage.removeItem(`mia_active_timer_${id}`);
}

export async function deleteParentProfile(id: string): Promise<void> {
  const profiles = await loadParentProfiles();
  await saveParentProfiles(profiles.filter((p) => p.id !== id));
  await supabase.from("memories").delete().eq("baby_id", id);
}

// ─── Memories ─────────────────────────────────────────────────────────────────

function memoryToRow(babyId: string, m: Memory) {
  return {
    baby_id: babyId,
    id: m.id,
    content: m.content,
    category: m.category,
    created_at: m.createdAt,
  };
}

function rowToMemory(r: any): Memory {
  return {
    id: r.id,
    babyId: r.baby_id,
    content: r.content,
    category: r.category,
    createdAt: r.created_at,
  };
}

export async function saveMemories(babyId: string, memories: Memory[]): Promise<void> {
  await reconcile(
    "memories",
    ["baby_id", babyId],
    "id",
    memories.map((m) => m.id),
    memories.map((m) => memoryToRow(babyId, m))
  );
}

export async function loadMemories(babyId: string): Promise<Memory[]> {
  const { data, error } = await supabase.from("memories").select("*").eq("baby_id", babyId);
  if (error) throw error;
  return (data ?? []).map(rowToMemory);
}

// ─── Weight Logs ──────────────────────────────────────────────────────────────

function weightLogToRow(babyId: string, l: WeightLog) {
  return {
    baby_id: babyId,
    id: l.id,
    weight_grams: l.weightGrams,
    measured_at: l.measuredAt,
    note: l.note ?? null,
  };
}

function rowToWeightLog(r: any): WeightLog {
  return {
    id: r.id,
    babyId: r.baby_id,
    weightGrams: r.weight_grams,
    measuredAt: r.measured_at,
    note: r.note ?? undefined,
  };
}

export async function loadWeightLogs(babyId: string): Promise<WeightLog[]> {
  const { data, error } = await supabase.from("weight_logs").select("*").eq("baby_id", babyId);
  if (error) throw error;
  return (data ?? []).map(rowToWeightLog).sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
}

export async function saveWeightLogs(babyId: string, logs: WeightLog[]): Promise<void> {
  await reconcile(
    "weight_logs",
    ["baby_id", babyId],
    "id",
    logs.map((l) => l.id),
    logs.map((l) => weightLogToRow(babyId, l))
  );
}

export async function addWeightLog(
  babyId: string,
  weightGrams: number,
  measuredAt: string,
  note?: string
): Promise<WeightLog> {
  const log: WeightLog = { id: Date.now().toString(), babyId, weightGrams, measuredAt, note };
  const existing = await loadWeightLogs(babyId);
  const updated = [...existing, log].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
  await saveWeightLogs(babyId, updated);
  return log;
}

export async function deleteWeightLog(babyId: string, logId: string): Promise<void> {
  const logs = await loadWeightLogs(babyId);
  await saveWeightLogs(babyId, logs.filter((l) => l.id !== logId));
}

// ─── Feeding Logs ─────────────────────────────────────────────────────────────

function feedingLogToRow(babyId: string, l: FeedingLog) {
  return {
    baby_id: babyId,
    id: l.id,
    type: l.type,
    started_at: l.startedAt,
    duration_minutes: l.durationMinutes,
    side: l.side ?? null,
    amount_ml: l.amountMl ?? null,
    note: l.note ?? null,
  };
}

function rowToFeedingLog(r: any): FeedingLog {
  return {
    id: r.id,
    babyId: r.baby_id,
    type: r.type,
    startedAt: r.started_at,
    durationMinutes: r.duration_minutes,
    side: r.side ?? undefined,
    amountMl: r.amount_ml ?? undefined,
    note: r.note ?? undefined,
  };
}

export async function loadFeedingLogs(babyId: string): Promise<FeedingLog[]> {
  const { data, error } = await supabase.from("feeding_logs").select("*").eq("baby_id", babyId);
  if (error) throw error;
  return (data ?? []).map(rowToFeedingLog);
}

export async function saveFeedingLogs(babyId: string, logs: FeedingLog[]): Promise<void> {
  await reconcile(
    "feeding_logs",
    ["baby_id", babyId],
    "id",
    logs.map((l) => l.id),
    logs.map((l) => feedingLogToRow(babyId, l))
  );
}

export async function addFeedingLog(babyId: string, entry: Omit<FeedingLog, "id" | "babyId">): Promise<FeedingLog> {
  const log: FeedingLog = { ...entry, id: Date.now().toString(), babyId };
  const existing = await loadFeedingLogs(babyId);
  await saveFeedingLogs(babyId, [log, ...existing]);
  return log;
}

export async function deleteFeedingLog(babyId: string, logId: string): Promise<void> {
  const logs = await loadFeedingLogs(babyId);
  await saveFeedingLogs(babyId, logs.filter((l) => l.id !== logId));
}

// ─── Sleep Logs ───────────────────────────────────────────────────────────────

function sleepLogToRow(babyId: string, l: SleepLog) {
  return {
    baby_id: babyId,
    id: l.id,
    type: l.type,
    started_at: l.startedAt,
    ended_at: l.endedAt,
    duration_minutes: l.durationMinutes,
    note: l.note ?? null,
  };
}

function rowToSleepLog(r: any): SleepLog {
  return {
    id: r.id,
    babyId: r.baby_id,
    type: r.type,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    durationMinutes: r.duration_minutes,
    note: r.note ?? undefined,
  };
}

export async function loadSleepLogs(babyId: string): Promise<SleepLog[]> {
  const { data, error } = await supabase.from("sleep_logs").select("*").eq("baby_id", babyId);
  if (error) throw error;
  return (data ?? []).map(rowToSleepLog);
}

export async function saveSleepLogs(babyId: string, logs: SleepLog[]): Promise<void> {
  await reconcile(
    "sleep_logs",
    ["baby_id", babyId],
    "id",
    logs.map((l) => l.id),
    logs.map((l) => sleepLogToRow(babyId, l))
  );
}

export async function addSleepLog(babyId: string, entry: Omit<SleepLog, "id" | "babyId">): Promise<SleepLog> {
  const log: SleepLog = { ...entry, id: Date.now().toString(), babyId };
  const existing = await loadSleepLogs(babyId);
  await saveSleepLogs(babyId, [log, ...existing]);
  return log;
}

export async function deleteSleepLog(babyId: string, logId: string): Promise<void> {
  const logs = await loadSleepLogs(babyId);
  await saveSleepLogs(babyId, logs.filter((l) => l.id !== logId));
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
  await deleteMomentPhotos(entry.photos);
}

// ─── Moment-Fotos (Supabase Storage) ──────────────────────────────────────────
// Fotos landen im privaten Bucket "moment-photos" unter <user_id>/<baby_id>/…,
// damit die ganze Familie sie auf jedem Gerät sieht. Im Moment-Eintrag wird nur
// eine Referenz "storage:<pfad>" gespeichert; angezeigt wird über signierte URLs.
// Klappt der Upload nicht (z. B. offline), bleibt die lokale URI als Rückfall.

const PHOTO_BUCKET = "moment-photos";
const STORAGE_PREFIX = "storage:";
const SIGNED_URL_SECONDS = 60 * 60;

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

async function readImageBytes(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === "web") return (await fetch(uri)).arrayBuffer();
  const bytes = await new File(uri).bytes();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** Lädt ein lokal ausgewähltes Foto hoch und gibt die zu speichernde Referenz zurück */
export async function uploadMomentPhoto(babyId: string, entryId: string, uri: string): Promise<string> {
  if (uri.startsWith(STORAGE_PREFIX)) return uri;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Nicht eingeloggt");
    const path = `${user.id}/${babyId}/${entryId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
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
    if (!ref.startsWith(STORAGE_PREFIX)) {
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

export async function deleteMomentPhotos(refs: string[]): Promise<void> {
  const paths = refs.filter((r) => r.startsWith(STORAGE_PREFIX)).map((r) => r.slice(STORAGE_PREFIX.length));
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
    if (ref.startsWith(STORAGE_PREFIX)) {
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
