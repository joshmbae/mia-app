import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Swipeable from "react-native-gesture-handler/Swipeable";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FeedingLog, SleepLog, ActiveTimer, BreastSide, SleepType, FeedingType } from "../types";
import {
  loadFeedingLogs,
  loadSleepLogs,
  addFeedingLog,
  addSleepLog,
  deleteFeedingLog,
  deleteSleepLog,
  loadWeightLogs,
} from "../utils/storage";
import TimerCard from "./TimerCard";

type ViewMode = "today" | "week";
type LogEntry = (FeedingLog & { kind: "feeding" }) | (SleepLog & { kind: "sleep" });

const SIDE_LABELS: Record<BreastSide, string> = { left: "Links", right: "Rechts", both: "Beide" };
const SLEEP_LABELS: Record<SleepType, string> = { nap: "Mittagsschlaf", night: "Nachtschlaf" };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}
function formatDuration(min: number) {
  if (min < 60) return `${min} Min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
function isSameDay(iso: string, ref: Date) {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}
function isWithinDays(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() < days * 86400000;
}

/**
 * Feeding/sleep tracker for one baby: live timer, retroactive manual entry,
 * today/week summary and log list. Used both from the Tracker tab (with a
 * child selector above it) and from a single baby's profile.
 */
export default function TrackerView({ babyId }: { babyId: string }) {
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [showBreastPicker, setShowBreastPicker] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);

  // Manuelles Nachtragen
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualKind, setManualKind] = useState<"breast" | "bottle" | "sleep">("breast");
  const [manualSide, setManualSide] = useState<BreastSide>("left");
  const [manualAmountMl, setManualAmountMl] = useState("");
  const [manualSleepType, setManualSleepType] = useState<SleepType>("nap");
  const [manualDate, setManualDate] = useState(new Date());
  const [manualTime, setManualTime] = useState(new Date());
  const [manualDuration, setManualDuration] = useState("");
  const [showManualDatePicker, setShowManualDatePicker] = useState(false);
  const [showManualTimePicker, setShowManualTimePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const [fl, sl, wl] = await Promise.all([
          loadFeedingLogs(babyId),
          loadSleepLogs(babyId),
          loadWeightLogs(babyId),
        ]);
        setFeedingLogs(fl);
        setSleepLogs(sl);
        setLatestWeight(wl.length > 0 ? wl[wl.length - 1].weightGrams : null);
        const saved = await AsyncStorage.getItem(`mia_active_timer_${babyId}`);
        setActiveTimer(saved ? JSON.parse(saved) : null);
      }
      load();
    }, [babyId])
  );

  async function startTimer(timer: ActiveTimer) {
    setActiveTimer(timer);
    await AsyncStorage.setItem(`mia_active_timer_${timer.babyId}`, JSON.stringify(timer));
    setShowBreastPicker(false);
    setShowSleepPicker(false);
  }

  async function stopTimer() {
    if (!activeTimer) return;
    const endedAt = new Date().toISOString();
    const durationMinutes = Math.max(
      1,
      Math.round((new Date(endedAt).getTime() - new Date(activeTimer.startedAt).getTime()) / 60000)
    );
    if (activeTimer.timerType === "feeding") {
      const log = await addFeedingLog(activeTimer.babyId, {
        type: activeTimer.feedingType ?? "breast",
        startedAt: activeTimer.startedAt,
        durationMinutes,
        side: activeTimer.side,
      });
      setFeedingLogs((prev) => [log, ...prev]);
    } else {
      const log = await addSleepLog(activeTimer.babyId, {
        type: activeTimer.sleepType ?? "nap",
        startedAt: activeTimer.startedAt,
        endedAt,
        durationMinutes,
      });
      setSleepLogs((prev) => [log, ...prev]);
    }
    await AsyncStorage.removeItem(`mia_active_timer_${activeTimer.babyId}`);
    setActiveTimer(null);
  }

  async function handleDeleteFeeding(logId: string) {
    await deleteFeedingLog(babyId, logId);
    setFeedingLogs((prev) => prev.filter((l) => l.id !== logId));
  }
  async function handleDeleteSleep(logId: string) {
    await deleteSleepLog(babyId, logId);
    setSleepLogs((prev) => prev.filter((l) => l.id !== logId));
  }

  function resetManualForm() {
    setManualKind("breast");
    setManualSide("left");
    setManualAmountMl("");
    setManualSleepType("nap");
    setManualDate(new Date());
    setManualTime(new Date());
    setManualDuration("");
    setShowManualForm(false);
  }

  async function handleManualSave() {
    const duration = parseInt(manualDuration, 10);
    if (!duration || duration <= 0 || duration > 1440) {
      Alert.alert("Ungültige Dauer", "Bitte Dauer in Minuten eingeben (1–1440).");
      return;
    }
    const startedAt = new Date(
      manualDate.getFullYear(), manualDate.getMonth(), manualDate.getDate(),
      manualTime.getHours(), manualTime.getMinutes()
    );
    if (startedAt.getTime() > Date.now()) {
      Alert.alert("Zeitpunkt in der Zukunft", "Bitte einen Zeitpunkt in der Vergangenheit wählen.");
      return;
    }

    if (manualKind === "sleep") {
      const endedAt = new Date(startedAt.getTime() + duration * 60000);
      const log = await addSleepLog(babyId, {
        type: manualSleepType,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMinutes: duration,
      });
      setSleepLogs((prev) => [log, ...prev]);
    } else {
      const amountMl = manualKind === "bottle" ? parseInt(manualAmountMl, 10) : undefined;
      const log = await addFeedingLog(babyId, {
        type: manualKind as FeedingType,
        startedAt: startedAt.toISOString(),
        durationMinutes: duration,
        side: manualKind === "breast" ? manualSide : undefined,
        amountMl: amountMl && amountMl > 0 ? amountMl : undefined,
      });
      setFeedingLogs((prev) => [log, ...prev]);
    }
    resetManualForm();
  }

  const today = new Date();
  const filteredFeedings = feedingLogs.filter((l) =>
    viewMode === "today" ? isSameDay(l.startedAt, today) : isWithinDays(l.startedAt, 7)
  );
  const filteredSleeps = sleepLogs.filter((l) =>
    viewMode === "today" ? isSameDay(l.startedAt, today) : isWithinDays(l.startedAt, 7)
  );
  const combined: LogEntry[] = [
    ...filteredFeedings.map((l) => ({ ...l, kind: "feeding" as const })),
    ...filteredSleeps.map((l) => ({ ...l, kind: "sleep" as const })),
  ].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const todayFeedings = feedingLogs.filter((l) => isSameDay(l.startedAt, today));
  const todaySleeps = sleepLogs.filter((l) => isSameDay(l.startedAt, today));
  const totalSleepMin = todaySleeps.reduce((s, l) => s + l.durationMinutes, 0);
  const totalFeedMin = todayFeedings.reduce((s, l) => s + l.durationMinutes, 0);

  return (
    <>
      {/* Active timer */}
      {activeTimer && <TimerCard timer={activeTimer} onStop={stopTimer} />}

      {/* Quick-start */}
      {!activeTimer && (
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: "#EAF2EF", borderColor: "#C5DDD8" }]}
            onPress={() => { setShowBreastPicker((v) => !v); setShowSleepPicker(false); }}
            activeOpacity={0.85}
          >
            <Text style={styles.quickEmoji}>🤱</Text>
            <Text style={[styles.quickLabel, { color: "#4A7C6F" }]}>Stillen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: "#F5EEF9", borderColor: "#DEC8F0" }]}
            onPress={() => { setShowSleepPicker((v) => !v); setShowBreastPicker(false); }}
            activeOpacity={0.85}
          >
            <Text style={styles.quickEmoji}>😴</Text>
            <Text style={[styles.quickLabel, { color: "#9B7BB8" }]}>Schlaf</Text>
          </TouchableOpacity>
        </View>
      )}

      {showBreastPicker && (
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>Welche Seite?</Text>
          <View style={styles.pickerRow}>
            {(["left", "right", "both"] as BreastSide[]).map((side) => (
              <TouchableOpacity
                key={side}
                style={styles.pickerBtn}
                onPress={() => startTimer({ babyId, timerType: "feeding", feedingType: "breast", side, startedAt: new Date().toISOString() })}
              >
                <Text style={styles.pickerBtnText}>{SIDE_LABELS[side]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.pickerBottleBtn}
            onPress={() => startTimer({ babyId, timerType: "feeding", feedingType: "bottle", startedAt: new Date().toISOString() })}
          >
            <Ionicons name="water-outline" size={16} color="#7B9EC8" />
            <Text style={styles.pickerBottleText}>Flasche</Text>
          </TouchableOpacity>
        </View>
      )}

      {showSleepPicker && (
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>Welche Art?</Text>
          <View style={styles.pickerRow}>
            {(["nap", "night"] as SleepType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerBtn, { backgroundColor: "#F5EEF9", borderColor: "#DEC8F0" }]}
                onPress={() => startTimer({ babyId, timerType: "sleep", sleepType: type, startedAt: new Date().toISOString() })}
              >
                <Text style={styles.pickerBtnText}>{SLEEP_LABELS[type]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Nachtragen */}
      {!activeTimer && (
        <TouchableOpacity
          style={styles.manualToggle}
          onPress={() => { setShowManualForm((v) => !v); setShowBreastPicker(false); setShowSleepPicker(false); }}
        >
          <Ionicons name={showManualForm ? "close" : "time-outline"} size={14} color="#7A7269" />
          <Text style={styles.manualToggleText}>
            {showManualForm ? "Abbrechen" : "Eintrag nachtragen"}
          </Text>
        </TouchableOpacity>
      )}

      {showManualForm && (
        <View style={styles.manualForm}>
          <Text style={styles.pickerTitle}>Art</Text>
          <View style={styles.pickerRow}>
            <TouchableOpacity
              style={[styles.pickerBtn, manualKind === "breast" && styles.pickerBtnActive]}
              onPress={() => setManualKind("breast")}
            >
              <Text style={styles.pickerBtnText}>Stillen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerBtn, manualKind === "bottle" && styles.pickerBtnActive]}
              onPress={() => setManualKind("bottle")}
            >
              <Text style={styles.pickerBtnText}>Flasche</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerBtn, manualKind === "sleep" && styles.pickerBtnActive]}
              onPress={() => setManualKind("sleep")}
            >
              <Text style={styles.pickerBtnText}>Schlaf</Text>
            </TouchableOpacity>
          </View>

          {manualKind === "breast" && (
            <>
              <Text style={styles.formLabel}>Seite</Text>
              <View style={styles.pickerRow}>
                {(["left", "right", "both"] as BreastSide[]).map((side) => (
                  <TouchableOpacity
                    key={side}
                    style={[styles.pickerBtn, manualSide === side && styles.pickerBtnActive]}
                    onPress={() => setManualSide(side)}
                  >
                    <Text style={styles.pickerBtnText}>{SIDE_LABELS[side]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {manualKind === "bottle" && (
            <>
              <Text style={styles.formLabel}>Menge (ml, optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="z. B. 120"
                placeholderTextColor="#B0A89A"
                value={manualAmountMl}
                onChangeText={setManualAmountMl}
                keyboardType="numeric"
              />
            </>
          )}

          {manualKind === "sleep" && (
            <>
              <Text style={styles.formLabel}>Art</Text>
              <View style={styles.pickerRow}>
                {(["nap", "night"] as SleepType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.pickerBtn, manualSleepType === type && styles.pickerBtnActive]}
                    onPress={() => setManualSleepType(type)}
                  >
                    <Text style={styles.pickerBtnText}>{SLEEP_LABELS[type]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.formLabel}>Beginn</Text>
          <View style={styles.pickerRow}>
            <TouchableOpacity style={styles.dateTrigger} onPress={() => setShowManualDatePicker(true)}>
              <Ionicons name="calendar-outline" size={16} color="#4A7C6F" />
              <Text style={styles.dateTriggerText}>
                {manualDate.toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateTrigger} onPress={() => setShowManualTimePicker(true)}>
              <Ionicons name="time-outline" size={16} color="#4A7C6F" />
              <Text style={styles.dateTriggerText}>
                {manualTime.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </TouchableOpacity>
          </View>
          {showManualDatePicker && (
            <DateTimePicker
              value={manualDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={(_, date) => {
                setShowManualDatePicker(Platform.OS === "ios");
                if (date) setManualDate(date);
              }}
            />
          )}
          {showManualTimePicker && (
            <DateTimePicker
              value={manualTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, date) => {
                setShowManualTimePicker(Platform.OS === "ios");
                if (date) setManualTime(date);
              }}
            />
          )}
          {Platform.OS === "ios" && (showManualDatePicker || showManualTimePicker) && (
            <TouchableOpacity
              onPress={() => { setShowManualDatePicker(false); setShowManualTimePicker(false); }}
              style={styles.dateConfirm}
            >
              <Text style={styles.dateConfirmText}>Fertig</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.formLabel}>Dauer (Minuten)</Text>
          <TextInput
            style={styles.input}
            placeholder="z. B. 15"
            placeholderTextColor="#B0A89A"
            value={manualDuration}
            onChangeText={setManualDuration}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.saveBtn, !manualDuration.trim() && styles.saveBtnDisabled]}
            onPress={handleManualSave}
            disabled={!manualDuration.trim()}
          >
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🤱</Text>
            <Text style={styles.summaryCount}>{todayFeedings.length}×</Text>
            <Text style={styles.summaryLabel}>
              {totalFeedMin > 0 ? `Ø ${Math.round(totalFeedMin / Math.max(todayFeedings.length, 1))} Min` : "Heute"}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>😴</Text>
            <Text style={styles.summaryCount}>{todaySleeps.length}×</Text>
            <Text style={styles.summaryLabel}>
              {totalSleepMin > 0 ? formatDuration(totalSleepMin) : "Heute"}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <TouchableOpacity
            style={styles.summaryItem}
            onPress={() => router.push(`/profile/weight/${babyId}`)}
          >
            <Text style={styles.summaryEmoji}>⚖️</Text>
            <Text style={styles.summaryCount}>
              {latestWeight ? `${(latestWeight / 1000).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}` : "—"}
            </Text>
            <Text style={[styles.summaryLabel, { color: "#4A7C6F" }]}>
              {latestWeight ? "kg →" : "Gewicht"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View toggle */}
      <View style={styles.viewToggle}>
        {(["today", "week"] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.viewBtn, viewMode === mode && styles.viewBtnActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.viewBtnText, viewMode === mode && styles.viewBtnTextActive]}>
              {mode === "today" ? "Heute" : "Diese Woche"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Log list */}
      {combined.map((entry) => (
        <Swipeable
          key={entry.id}
          renderRightActions={() => (
            <TouchableOpacity
              style={styles.deleteAction}
              onPress={() => entry.kind === "feeding" ? handleDeleteFeeding(entry.id) : handleDeleteSleep(entry.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        >
          {entry.kind === "feeding" ? <FeedingRow log={entry} /> : <SleepRow log={entry} />}
        </Swipeable>
      ))}

      {combined.length === 0 && (
        <View style={styles.listEmpty}>
          <Text style={styles.listEmptyIcon}>{viewMode === "today" ? "🌅" : "📅"}</Text>
          <Text style={styles.listEmptyText}>
            {viewMode === "today" ? "Noch keine Einträge heute." : "Keine Einträge diese Woche."}
          </Text>
        </View>
      )}
    </>
  );
}

function FeedingRow({ log }: { log: FeedingLog }) {
  const sideMap: Record<string, string> = { left: "links", right: "rechts", both: "beide Seiten" };
  const label = log.type === "bottle"
    ? `Flasche${log.amountMl ? ` · ${log.amountMl} ml` : ""}`
    : `Stillen${log.side ? " · " + sideMap[log.side] : ""}`;
  return (
    <View style={styles.logRow}>
      <View style={[styles.logIcon, { backgroundColor: "#EAF2EF" }]}>
        <Text style={styles.logIconEmoji}>🤱</Text>
      </View>
      <View style={styles.logBody}>
        <Text style={styles.logTitle}>{label}</Text>
        <Text style={styles.logMeta}>{formatDuration(log.durationMinutes)}</Text>
      </View>
      <Text style={styles.logTime}>{formatTime(log.startedAt)}</Text>
    </View>
  );
}

function SleepRow({ log }: { log: SleepLog }) {
  return (
    <View style={styles.logRow}>
      <View style={[styles.logIcon, { backgroundColor: "#F5EEF9" }]}>
        <Text style={styles.logIconEmoji}>😴</Text>
      </View>
      <View style={styles.logBody}>
        <Text style={styles.logTitle}>{SLEEP_LABELS[log.type]}</Text>
        <Text style={styles.logMeta}>
          {formatTime(log.startedAt)} – {formatTime(log.endedAt)} · {formatDuration(log.durationMinutes)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  quickBtn: {
    flex: 1, alignItems: "center", paddingVertical: 18,
    borderRadius: 18, borderWidth: 1.5, gap: 6,
  },
  quickEmoji: { fontSize: 28 },
  quickLabel: { fontSize: 15, fontWeight: "700" },

  pickerCard: { backgroundColor: "#F0EBE3", borderRadius: 16, padding: 16, marginBottom: 14 },
  pickerTitle: { fontSize: 13, fontWeight: "700", color: "#7A7269", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  pickerRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  pickerBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", backgroundColor: "#EAF2EF", borderWidth: 1, borderColor: "#C5DDD8" },
  pickerBtnActive: { backgroundColor: "#4A7C6F", borderColor: "#4A7C6F" },
  pickerBtnText: { fontSize: 14, fontWeight: "600", color: "#2D2A26" },
  pickerBottleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#C5DDD8", backgroundColor: "#EEF4F9" },
  pickerBottleText: { fontSize: 14, fontWeight: "600", color: "#7B9EC8" },

  manualToggle: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 2, marginBottom: 10,
  },
  manualToggleText: { fontSize: 13, fontWeight: "600", color: "#7A7269" },
  manualForm: { backgroundColor: "#F0EBE3", borderRadius: 16, padding: 16, marginBottom: 14 },
  formLabel: {
    fontSize: 12, fontWeight: "700", color: "#7A7269",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
  },
  input: {
    backgroundColor: "#FDFAF6", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#2D2A26", marginBottom: 14,
  },
  dateTrigger: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FDFAF6", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  dateTriggerText: { fontSize: 14, color: "#2D2A26" },
  dateConfirm: { alignSelf: "flex-end", paddingVertical: 4, marginBottom: 10 },
  dateConfirmText: { color: "#4A7C6F", fontWeight: "700" },
  saveBtn: {
    backgroundColor: "#4A7C6F", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  summaryCard: {
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, marginBottom: 14,
    shadowColor: "#2D2A26", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryEmoji: { fontSize: 22 },
  summaryCount: { fontSize: 18, fontWeight: "800", color: "#2D2A26" },
  summaryLabel: { fontSize: 11, color: "#7A7269" },
  summaryDivider: { width: 1, height: 48, backgroundColor: "#E5DDD5" },

  viewToggle: { flexDirection: "row", backgroundColor: "#F0EBE3", borderRadius: 12, padding: 3, marginBottom: 14, gap: 3 },
  viewBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  viewBtnActive: { backgroundColor: "#4A7C6F" },
  viewBtnText: { fontSize: 13, fontWeight: "600", color: "#7A7269" },
  viewBtnTextActive: { color: "#FFFFFF" },

  logRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 14, padding: 12, marginBottom: 8, gap: 12,
    shadowColor: "#2D2A26", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  logIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  logIconEmoji: { fontSize: 20 },
  logBody: { flex: 1 },
  logTitle: { fontSize: 15, fontWeight: "600", color: "#2D2A26" },
  logMeta: { fontSize: 12, color: "#7A7269", marginTop: 2 },
  logTime: { fontSize: 13, color: "#B0A89A" },
  deleteAction: { backgroundColor: "#C0392B", borderRadius: 14, width: 60, alignItems: "center", justifyContent: "center", marginBottom: 8 },

  listEmpty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  listEmptyIcon: { fontSize: 36 },
  listEmptyText: { fontSize: 14, color: "#B0A89A" },
});
