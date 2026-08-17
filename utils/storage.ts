import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { BabyProfile, ParentProfile, PregnancyProfile, ChatMessage, ChatSession, Memory, WeightLog, FeedingLog, SleepLog, MilestoneProgress } from "../types";

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
  await supabase.from("milestone_progress").delete().eq("baby_id", id);
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

// ─── Milestone Progress ───────────────────────────────────────────────────────

function milestoneProgressToRow(babyId: string, p: MilestoneProgress) {
  return {
    baby_id: babyId,
    milestone_id: p.milestoneId,
    status: p.status,
    achieved_at: p.achievedAt ?? null,
  };
}

function rowToMilestoneProgress(r: any): MilestoneProgress {
  return {
    milestoneId: r.milestone_id,
    status: r.status,
    achievedAt: r.achieved_at ?? undefined,
  };
}

export async function loadMilestoneProgress(babyId: string): Promise<MilestoneProgress[]> {
  const { data, error } = await supabase.from("milestone_progress").select("*").eq("baby_id", babyId);
  if (error) throw error;
  return (data ?? []).map(rowToMilestoneProgress);
}

export async function saveMilestoneProgress(babyId: string, progress: MilestoneProgress[]): Promise<void> {
  await reconcile(
    "milestone_progress",
    ["baby_id", babyId],
    "milestone_id",
    progress.map((p) => p.milestoneId),
    progress.map((p) => milestoneProgressToRow(babyId, p))
  );
}

export async function setMilestoneStatus(
  babyId: string,
  milestoneId: string,
  status: MilestoneProgress["status"]
): Promise<MilestoneProgress[]> {
  const existing = await loadMilestoneProgress(babyId);
  const filtered = existing.filter((p) => p.milestoneId !== milestoneId);
  const updated: MilestoneProgress[] = [
    ...filtered,
    {
      milestoneId,
      status,
      achievedAt: status === "achieved" ? new Date().toISOString() : undefined,
    },
  ];
  await saveMilestoneProgress(babyId, updated);
  return updated;
}
