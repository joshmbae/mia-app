import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BabyProfile, MomentEntry } from "../../../types";
import { loadProfiles, loadMoments, resolvePhotoUrls } from "../../../utils/storage";
import {
  Milestone,
  MilestoneCategory,
  MILESTONES,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
} from "../../../utils/milestoneData";
import { DEVELOPMENT_PHASES, getAgeWeeks, getCurrentPhase, getPhaseForDate } from "../../../utils/developmentPhases";
import {
  buildChapters,
  momentTitle,
  momentEmoji,
  momentColor,
  formatMomentDate,
  ageAtDate,
} from "../../../utils/moments";
import { exportBook } from "../../../utils/bookExport";
import { colors, radius, shadow, shadowSoft, tint } from "../../../utils/theme";

type Tab = "zeitstrahl" | "meilensteine" | "phasen";

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "zeitstrahl", label: "Zeitstrahl", icon: "git-commit-outline" },
  { key: "meilensteine", label: "Momente", icon: "sparkles-outline" },
  { key: "phasen", label: "Phasen", icon: "leaf-outline" },
];

function berechneAlterLabel(birthDateISO: string): string {
  const d = Math.floor((Date.now() - new Date(birthDateISO).getTime()) / 86400000);
  if (d < 14) return `${d} ${d === 1 ? "Tag" : "Tage"} alt`;
  const w = Math.floor(d / 7), wd = d % 7;
  if (d < 112) return wd > 0 ? `${w} Wo. ${wd} T. alt` : `${w} Wochen alt`;
  const mo = Math.floor(d / 30.44), mw = Math.floor((d % 30.44) / 7);
  if (d < 730) return mw > 0 ? `${mo} Mo. ${mw} Wo. alt` : `${mo} Monate alt`;
  const y = Math.floor(d / 365), m = Math.floor((d % 365) / 30);
  return m > 0 ? `${y} J. ${m} Mo.` : `${y} Jahre alt`;
}

function openMoment(babyId: string, opts: { entryId?: string; milestoneId?: string } = {}) {
  const q = opts.entryId ? `?entryId=${opts.entryId}` : opts.milestoneId ? `?milestoneId=${opts.milestoneId}` : "";
  router.push(`/profile/moment/${babyId}${q}`);
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DiaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [moments, setMoments] = useState<MomentEntry[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<Tab>("zeitstrahl");
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const profiles = await loadProfiles();
        setProfile(profiles.find((p) => p.id === id) ?? null);
        const loaded = await loadMoments(id);
        setMoments(loaded);
        setPhotoUrls(await resolvePhotoUrls(loaded.flatMap((m) => m.photos)));
      }
      load();
    }, [id])
  );

  async function handleExport() {
    if (!profile) return;
    if (moments.length === 0) {
      Alert.alert("Noch leer", "Halte zuerst ein paar Momente fest — dann wird daraus ein Buch.");
      return;
    }
    setExporting(true);
    try {
      await exportBook(profile, moments);
    } catch (err) {
      Alert.alert("Export fehlgeschlagen", "Das Buch konnte gerade nicht erstellt werden. Bitte versuch es noch einmal.");
    } finally {
      setExporting(false);
    }
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, { backgroundColor: profile.avatarColor }]}>
              <Text style={styles.headerAvatarLetter}>{profile.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{profile.name}s Tagebuch</Text>
            <Text style={styles.headerAge}>{berechneAlterLabel(profile.birthDate)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleExport} style={styles.bookBtn} disabled={exporting}>
          {exporting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="book-outline" size={16} color={colors.primary} />
              <Text style={styles.bookBtnText}>Buch</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={tab.icon} size={15} color={active ? colors.surface : colors.inkSoft} />
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === "zeitstrahl" && (
        <TimelineTab profile={profile} moments={moments} photoUrls={photoUrls} />
      )}
      {activeTab === "meilensteine" && (
        <MomentsTab profile={profile} moments={moments} photoUrls={photoUrls} />
      )}
      {activeTab === "phasen" && <PhasesTab profile={profile} moments={moments} />}

      {/* ── Floating Action ── */}
      <TouchableOpacity style={styles.fab} onPress={() => openMoment(profile.id)} activeOpacity={0.88}>
        <Ionicons name="add" size={22} color={colors.surface} />
        <Text style={styles.fabText}>Moment festhalten</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Tab 1: Zeitstrahl ────────────────────────────────────────────────────────

function TimelineTab({
  profile,
  moments,
  photoUrls,
}: {
  profile: BabyProfile;
  moments: MomentEntry[];
  photoUrls: Record<string, string>;
}) {
  const chapters = buildChapters(profile.birthDate, moments);

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Start: Geburt */}
      <View style={styles.tlRow}>
        <View style={styles.tlSpine}>
          <View style={[styles.tlNode, styles.tlNodeBig, { backgroundColor: colors.sun }]}>
            <Text style={styles.tlNodeEmojiBig}>🐣</Text>
          </View>
          <View style={styles.tlLine} />
        </View>
        <View style={[styles.birthCard]}>
          <Text style={styles.birthKicker}>Hier beginnt alles</Text>
          <Text style={styles.birthTitle}>{profile.name} kommt auf die Welt</Text>
          <Text style={styles.birthDate}>{formatMomentDate(profile.birthDate)}</Text>
        </View>
      </View>

      {moments.length === 0 && (
        <View style={styles.tlRow}>
          <View style={styles.tlSpine}>
            <View style={[styles.tlNode, { backgroundColor: colors.lilacSoft }]}>
              <Text style={styles.tlNodeEmoji}>✏️</Text>
            </View>
            <View style={styles.tlLine} />
          </View>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Die Seiten sind noch leer</Text>
            <Text style={styles.emptyText}>
              Das erste Lächeln, der erste Brei, ein ganz normaler schöner Dienstag — halte fest, was euch wichtig ist. Mit Foto und ein paar Zeilen.
            </Text>
          </View>
        </View>
      )}

      {chapters.map((chapter) => (
        <View key={chapter.key}>
          {/* Kapitel */}
          <View style={styles.tlRow}>
            <View style={styles.tlSpine}>
              <View style={styles.tlChapterDot} />
              <View style={styles.tlLine} />
            </View>
            <View style={styles.chapterChip}>
              <Text style={styles.chapterEmoji}>{chapter.emoji}</Text>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                <Text style={styles.chapterSub}>{chapter.subtitle}</Text>
              </View>
            </View>
          </View>

          {chapter.moments.map((m, i) => (
            <TimelineMoment
              key={m.id}
              profile={profile}
              moment={m}
              photoUrls={photoUrls}
              tilt={i % 2 === 0 ? -1.2 : 1.2}
            />
          ))}
        </View>
      ))}

      {/* Ende: Heute */}
      <View style={styles.tlRow}>
        <View style={styles.tlSpine}>
          <View style={[styles.tlNode, styles.tlNodeBig, { backgroundColor: colors.primarySoft }]}>
            <Text style={styles.tlNodeEmojiBig}>🌈</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.todayCard} onPress={() => openMoment(profile.id)} activeOpacity={0.85}>
          <Text style={styles.todayKicker}>Heute · {berechneAlterLabel(profile.birthDate)}</Text>
          <Text style={styles.todayTitle}>Fortsetzung folgt …</Text>
          <View style={styles.todayCta}>
            <Ionicons name="add-circle" size={16} color={colors.primary} />
            <Text style={styles.todayCtaText}>Nächsten Moment festhalten</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function TimelineMoment({
  profile,
  moment,
  photoUrls,
  tilt,
}: {
  profile: BabyProfile;
  moment: MomentEntry;
  photoUrls: Record<string, string>;
  tilt: number;
}) {
  const color = momentColor(moment);
  const firstPhoto = moment.photos[0] ? photoUrls[moment.photos[0]] : undefined;
  const extra = moment.photos.length - 1;

  return (
    <View style={styles.tlRow}>
      <View style={styles.tlSpine}>
        <View style={[styles.tlNode, { backgroundColor: tint(color, 0.18), borderColor: color }]}>
          <Text style={styles.tlNodeEmoji}>{momentEmoji(moment)}</Text>
        </View>
        <View style={styles.tlLine} />
      </View>
      <TouchableOpacity
        style={styles.momentCard}
        onPress={() => openMoment(profile.id, { entryId: moment.id })}
        activeOpacity={0.88}
      >
        {firstPhoto && (
          <View style={[styles.polaroid, { transform: [{ rotate: `${tilt}deg` }] }]}>
            <Image source={{ uri: firstPhoto }} style={styles.polaroidImg} />
            {extra > 0 && (
              <View style={styles.morePhotos}>
                <Ionicons name="images" size={11} color={colors.surface} />
                <Text style={styles.morePhotosText}>+{extra}</Text>
              </View>
            )}
          </View>
        )}
        <View style={[styles.ageTag, { backgroundColor: tint(color, 0.14) }]}>
          <Text style={[styles.ageTagText, { color }]}>{ageAtDate(profile.birthDate, moment.happenedOn)}</Text>
        </View>
        <Text style={styles.momentTitle}>{momentTitle(moment)}</Text>
        <Text style={styles.momentDate}>{formatMomentDate(moment.happenedOn)}</Text>
        {moment.note ? (
          <Text style={styles.momentNote} numberOfLines={3}>
            {moment.note}
          </Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

// ─── Tab 2: Momente (Meilenstein-Katalog) ─────────────────────────────────────

function MomentsTab({
  profile,
  moments,
  photoUrls,
}: {
  profile: BabyProfile;
  moments: MomentEntry[];
  photoUrls: Record<string, string>;
}) {
  const [category, setCategory] = useState<MilestoneCategory | "all" | "eigene">("all");
  const byMilestone = new Map(moments.filter((m) => m.milestoneId).map((m) => [m.milestoneId as string, m]));
  const custom = moments.filter((m) => !m.milestoneId);
  const shownCategories = category === "all" ? CATEGORY_ORDER : category === "eigene" ? [] : [category];

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.hintCard}>
        <Text style={styles.hintEmoji}>💛</Text>
        <Text style={styles.hintText}>
          Kein Abhaken, kein Zeitplan. Tippe einfach auf einen Moment, wenn ihr ihn erlebt habt — jedes Kind hat sein eigenes Tempo und seine eigene Reihenfolge.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
        style={styles.catScroll}
      >
        <CategoryChip label="Alle" emoji="🌼" color={colors.ink} active={category === "all"} onPress={() => setCategory("all")} />
        {CATEGORY_ORDER.map((c) => (
          <CategoryChip
            key={c}
            label={CATEGORY_LABELS[c]}
            emoji={CATEGORY_EMOJIS[c]}
            color={CATEGORY_COLORS[c]}
            active={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
        <CategoryChip label="Eigene" emoji="🌟" color={colors.coral} active={category === "eigene"} onPress={() => setCategory("eigene")} />
      </ScrollView>

      {(category === "all" || category === "eigene") && (
        <View style={styles.catSection}>
          <Text style={styles.catSectionTitle}>🌟 Eure eigenen Momente</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={[styles.tile, styles.tileAdd]} onPress={() => openMoment(profile.id)} activeOpacity={0.85}>
              <View style={styles.tileAddIcon}>
                <Ionicons name="add" size={22} color={colors.coral} />
              </View>
              <Text style={styles.tileTitle}>Eigener Moment</Text>
              <Text style={styles.tileSub}>Alles, was euch wichtig ist</Text>
            </TouchableOpacity>
            {custom.map((m) => (
              <RecordedTile
                key={m.id}
                emoji={momentEmoji(m)}
                title={momentTitle(m)}
                date={m.happenedOn}
                color={momentColor(m)}
                photo={m.photos[0] ? photoUrls[m.photos[0]] : undefined}
                onPress={() => openMoment(profile.id, { entryId: m.id })}
              />
            ))}
          </View>
        </View>
      )}

      {shownCategories.map((c) => (
        <View key={c} style={styles.catSection}>
          <Text style={styles.catSectionTitle}>
            {CATEGORY_EMOJIS[c]} {CATEGORY_LABELS[c]}
          </Text>
          <View style={styles.grid}>
            {MILESTONES.filter((ms) => ms.category === c).map((ms) => {
              const entry = byMilestone.get(ms.id);
              return entry ? (
                <RecordedTile
                  key={ms.id}
                  emoji={ms.emoji}
                  title={ms.title}
                  date={entry.happenedOn}
                  color={CATEGORY_COLORS[c]}
                  photo={entry.photos[0] ? photoUrls[entry.photos[0]] : undefined}
                  onPress={() => openMoment(profile.id, { entryId: entry.id })}
                />
              ) : (
                <OpenTile key={ms.id} milestone={ms} onPress={() => openMoment(profile.id, { milestoneId: ms.id })} />
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function CategoryChip({
  label, emoji, color, active, onPress,
}: { label: string; emoji: string; color: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.catChip, active && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.catChipEmoji}>{emoji}</Text>
      <Text style={[styles.catChipText, active && { color: colors.surface }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function OpenTile({ milestone, onPress }: { milestone: Milestone; onPress: () => void }) {
  const color = CATEGORY_COLORS[milestone.category];
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.tileEmojiWrap, { backgroundColor: tint(color, 0.12) }]}>
        <Text style={styles.tileEmoji}>{milestone.emoji}</Text>
      </View>
      <Text style={styles.tileTitle} numberOfLines={2}>{milestone.title}</Text>
      <View style={styles.tileAddRow}>
        <Ionicons name="add" size={13} color={color} />
        <Text style={[styles.tileAddText, { color }]}>festhalten</Text>
      </View>
    </TouchableOpacity>
  );
}

function RecordedTile({
  emoji, title, date, color, photo, onPress,
}: { emoji: string; title: string; date: string; color: string; photo?: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.tile, styles.tileRecorded, { backgroundColor: tint(color, 0.12), borderColor: tint(color, 0.35) }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={styles.tilePhoto} />
      ) : (
        <View style={[styles.tileEmojiWrap, { backgroundColor: colors.surface }]}>
          <Text style={styles.tileEmoji}>{emoji}</Text>
        </View>
      )}
      <Text style={styles.tileTitle} numberOfLines={2}>{title}</Text>
      <View style={styles.tileAddRow}>
        <Ionicons name="heart" size={11} color={color} />
        <Text style={[styles.tileAddText, { color }]}>{formatMomentDate(date)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Tab 3: Phasen ────────────────────────────────────────────────────────────

function PhasesTab({ profile, moments }: { profile: BabyProfile; moments: MomentEntry[] }) {
  const ageWeeks = getAgeWeeks(profile.birthDate);
  const current = getCurrentPhase(profile.birthDate);
  const [expanded, setExpanded] = useState<string | null>(current?.id ?? null);

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.hintCard}>
        <Text style={styles.hintEmoji}>🧭</Text>
        <Text style={styles.hintText}>
          Die Phasen sind keine Checkliste — sie erzählen nur, was viele Familien in einer Zeit ungefähr erleben. Euer Weg darf ganz anders aussehen.
        </Text>
      </View>

      {/* Aktuelle Phase zuerst, danach alle Phasen in Reihenfolge */}
      {[...(current ? [current] : []), ...DEVELOPMENT_PHASES.filter((p) => p.id !== current?.id)].map((phase, index) => {
        const isCurrent = current?.id === phase.id;
        const isFuture = ageWeeks < phase.weeksFrom;
        const isOpen = expanded === phase.id;
        const phaseMoments = moments.filter((m) => getPhaseForDate(profile.birthDate, m.happenedOn)?.id === phase.id);

        return (
          <View key={phase.id}>
            {current && index === 1 && <Text style={styles.allPhasesLabel}>Alle Phasen</Text>}
            <TouchableOpacity
              style={[styles.phaseCard, isCurrent && styles.phaseCardCurrent]}
              onPress={() => setExpanded(isOpen ? null : phase.id)}
              activeOpacity={0.88}
            >
              <View style={styles.phaseTop}>
                <View style={[styles.phaseEmojiWrap, isCurrent && { backgroundColor: colors.surface }]}>
                  <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.phaseTitleRow}>
                    <Text style={styles.phaseTitle}>{phase.title}</Text>
                    {isCurrent && (
                      <View style={styles.nowBadge}>
                        <Text style={styles.nowBadgeText}>Jetzt</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.phaseAge}>
                    {phase.ageLabel}
                    {phaseMoments.length > 0 ? ` · ${phaseMoments.length} ${phaseMoments.length === 1 ? "Moment" : "Momente"}` : ""}
                  </Text>
                </View>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.muted} />
              </View>

              {isOpen && (
                <View style={styles.phaseBody}>
                  <Text style={styles.phaseSummary}>{phase.summary}</Text>

                  <Text style={styles.phaseLabel}>Was viele Familien {isFuture ? "in dieser Zeit" : "gerade"} erleben</Text>
                  {phase.typical.map((t, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>{t}</Text>
                    </View>
                  ))}

                  {phase.developmentHint && (
                    <View style={[styles.infoBox, { backgroundColor: colors.sunSoft }]}>
                      <Text style={styles.infoBoxTitle}>🌪️ Unruhigere Zeit?</Text>
                      <Text style={styles.infoBoxText}>{phase.developmentHint}</Text>
                    </View>
                  )}

                  <View style={[styles.infoBox, { backgroundColor: colors.skySoft }]}>
                    <Text style={styles.infoBoxTitle}>💡 Kleine Idee</Text>
                    <Text style={styles.infoBoxText}>{phase.parentTip}</Text>
                  </View>

                  <View style={[styles.infoBox, { backgroundColor: colors.lilacSoft }]}>
                    <Text style={styles.infoBoxTitle}>💜 Für dich</Text>
                    <Text style={styles.infoBoxText}>{phase.forParents}</Text>
                  </View>

                  {phaseMoments.length > 0 && (
                    <>
                      <Text style={styles.phaseLabel}>Eure Momente aus dieser Zeit</Text>
                      <View style={styles.phaseMomentRow}>
                        {phaseMoments.map((m) => (
                          <TouchableOpacity
                            key={m.id}
                            style={[styles.phaseMomentChip, { backgroundColor: tint(momentColor(m), 0.14) }]}
                            onPress={() => openMoment(profile.id, { entryId: m.id })}
                          >
                            <Text style={{ fontSize: 13 }}>{momentEmoji(m)}</Text>
                            <Text style={[styles.phaseMomentText, { color: momentColor(m) }]} numberOfLines={1}>
                              {momentTitle(m)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <Text style={styles.source}>
        Inhalte angelehnt an CDC, AAP und WHO. Wenn dich etwas beschäftigt, sprich jederzeit mit deiner Hebamme oder Kinderärztin — dafür braucht es keinen Anlass.
      </Text>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const SPINE = 44;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
    ...shadowSoft,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.surface,
  },
  headerAvatarLetter: { fontSize: 17, fontWeight: "800", color: colors.surface },
  headerName: { fontSize: 17, fontWeight: "800", color: colors.ink, letterSpacing: -0.3 },
  headerAge: { fontSize: 12, color: colors.muted, marginTop: 1 },
  bookBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.primarySoft, borderRadius: radius.pill,
    paddingHorizontal: 12, height: 36, minWidth: 74, justifyContent: "center",
  },
  bookBtnText: { fontSize: 13, fontWeight: "800", color: colors.primary },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
    ...shadowSoft,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", gap: 5,
    paddingVertical: 9, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center",
  },
  tabBtnActive: { backgroundColor: colors.ink },
  tabBtnText: { fontSize: 13, fontWeight: "700", color: colors.inkSoft },
  tabBtnTextActive: { color: colors.surface },

  tabContent: { padding: 16, paddingBottom: 120 },

  fab: {
    position: "absolute", bottom: 24, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingHorizontal: 20, paddingVertical: 14,
    ...shadow, shadowOpacity: 0.18,
  },
  fabText: { color: colors.surface, fontSize: 15, fontWeight: "800" },

  // ── Timeline
  tlRow: { flexDirection: "row" },
  tlSpine: { width: SPINE, alignItems: "center" },
  tlLine: {
    flex: 1, width: 3, minHeight: 14, borderRadius: 2,
    backgroundColor: "#EADFD0",
    marginVertical: 3,
  },
  tlNode: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.surface,
    marginTop: 10,
  },
  tlNodeBig: { width: 40, height: 40, borderRadius: 20, marginTop: 4 },
  tlNodeEmoji: { fontSize: 15 },
  tlNodeEmojiBig: { fontSize: 20 },
  tlChapterDot: {
    width: 12, height: 12, borderRadius: 6, marginTop: 18,
    backgroundColor: colors.ink,
  },

  birthCard: {
    flex: 1, marginLeft: 6, marginBottom: 18,
    backgroundColor: colors.sunSoft, borderRadius: radius.lg, padding: 16,
  },
  birthKicker: { fontSize: 11, fontWeight: "800", color: "#B7862A", textTransform: "uppercase", letterSpacing: 1 },
  birthTitle: { fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: 4, letterSpacing: -0.3 },
  birthDate: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },

  emptyCard: {
    flex: 1, marginLeft: 6, marginBottom: 18,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    borderWidth: 2, borderStyle: "dashed", borderColor: colors.line,
  },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: colors.ink, marginBottom: 6 },
  emptyText: { fontSize: 13, color: colors.inkSoft, lineHeight: 19 },

  chapterChip: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    marginLeft: 6, marginTop: 8, marginBottom: 12,
  },
  chapterEmoji: { fontSize: 22 },
  chapterTitle: { fontSize: 16, fontWeight: "800", color: colors.ink, letterSpacing: -0.3 },
  chapterSub: { fontSize: 12, color: colors.muted, fontWeight: "600" },

  momentCard: {
    flex: 1, marginLeft: 6, marginBottom: 16,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14,
    ...shadow,
  },
  polaroid: {
    backgroundColor: colors.surface, padding: 6, paddingBottom: 14,
    borderRadius: 8, marginBottom: 12,
    ...shadowSoft, shadowOpacity: 0.12,
  },
  polaroidImg: { width: "100%", aspectRatio: 16 / 10, borderRadius: 4, backgroundColor: colors.surfaceMuted },
  morePhotos: {
    position: "absolute", right: 12, bottom: 20,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(46,42,53,0.65)", borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  morePhotosText: { color: colors.surface, fontSize: 11, fontWeight: "800" },
  ageTag: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, marginBottom: 6 },
  ageTagText: { fontSize: 11, fontWeight: "800" },
  momentTitle: { fontSize: 16, fontWeight: "800", color: colors.ink, letterSpacing: -0.2 },
  momentDate: { fontSize: 12, color: colors.muted, marginTop: 2 },
  momentNote: { fontSize: 14, color: colors.inkSoft, lineHeight: 20, marginTop: 8, fontStyle: "italic" },

  todayCard: {
    flex: 1, marginLeft: 6,
    backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: 16,
  },
  todayKicker: { fontSize: 11, fontWeight: "800", color: colors.primary, textTransform: "uppercase", letterSpacing: 1 },
  todayTitle: { fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: 4 },
  todayCta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  todayCtaText: { fontSize: 13, fontWeight: "800", color: colors.primary },

  // ── Momente-Katalog
  hintCard: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 14,
    ...shadowSoft,
  },
  hintEmoji: { fontSize: 18 },
  hintText: { flex: 1, fontSize: 13, color: colors.inkSoft, lineHeight: 19 },

  catScroll: { marginHorizontal: -16, marginBottom: 6 },
  catRow: { paddingHorizontal: 16, gap: 8 },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1.5, borderColor: colors.line,
  },
  catChipEmoji: { fontSize: 14 },
  catChipText: { fontSize: 13, fontWeight: "700", color: colors.ink },

  catSection: { marginTop: 14 },
  catSectionTitle: { fontSize: 15, fontWeight: "800", color: colors.ink, marginBottom: 10, letterSpacing: -0.2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "48%", flexGrow: 1, maxWidth: "50%",
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12,
    borderWidth: 1.5, borderColor: colors.line,
    minHeight: 132,
  },
  tileRecorded: { borderWidth: 1.5 },
  tileAdd: { borderStyle: "dashed", borderColor: tint(colors.coral, 0.5), backgroundColor: colors.coralSoft },
  tileAddIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  tileEmojiWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  tileEmoji: { fontSize: 22 },
  tilePhoto: { width: "100%", height: 72, borderRadius: 12, marginBottom: 10, backgroundColor: colors.surfaceMuted },
  tileTitle: { fontSize: 14, fontWeight: "800", color: colors.ink, lineHeight: 18 },
  tileSub: { fontSize: 12, color: colors.inkSoft, marginTop: 3 },
  tileAddRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: "auto", paddingTop: 6 },
  tileAddText: { fontSize: 11.5, fontWeight: "800" },

  // ── Phasen
  allPhasesLabel: {
    fontSize: 12, fontWeight: "800", color: colors.muted,
    textTransform: "uppercase", letterSpacing: 0.8, marginTop: 14, marginBottom: 10, marginLeft: 4,
  },
  phaseCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, marginBottom: 10,
    ...shadowSoft,
  },
  phaseCardCurrent: { backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary },
  phaseTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  phaseEmojiWrap: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surfaceMuted,
    alignItems: "center", justifyContent: "center",
  },
  phaseEmoji: { fontSize: 20 },
  phaseTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  phaseTitle: { fontSize: 15, fontWeight: "800", color: colors.ink },
  nowBadge: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  nowBadgeText: { fontSize: 10.5, fontWeight: "800", color: colors.surface },
  phaseAge: { fontSize: 12, color: colors.muted, marginTop: 2 },
  phaseBody: { marginTop: 14 },
  phaseSummary: { fontSize: 14, color: colors.ink, lineHeight: 21, marginBottom: 12 },
  phaseLabel: {
    fontSize: 11, fontWeight: "800", color: colors.muted,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 4,
  },
  bulletRow: { flexDirection: "row", gap: 9, marginBottom: 6 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sun, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 13.5, color: colors.inkSoft, lineHeight: 20 },
  infoBox: { borderRadius: radius.md, padding: 12, marginTop: 10 },
  infoBoxTitle: { fontSize: 13, fontWeight: "800", color: colors.ink, marginBottom: 4 },
  infoBoxText: { fontSize: 13, color: colors.inkSoft, lineHeight: 19 },
  phaseMomentRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  phaseMomentChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, maxWidth: "100%",
  },
  phaseMomentText: { fontSize: 12, fontWeight: "700", flexShrink: 1 },
  source: { fontSize: 11.5, color: colors.muted, textAlign: "center", marginTop: 14, lineHeight: 17 },
});
