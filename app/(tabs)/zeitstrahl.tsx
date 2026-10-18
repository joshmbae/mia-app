import React, { useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Child } from "../../types";
import { useFamily } from "../../utils/family";
import { useChildData } from "../../utils/useChildData";
import { usePhotoUrls } from "../../utils/usePhotoUrls";
import { colors, clay, clayButton, fonts, radius, tint, TAB_BAR_SPACE, type } from "../../utils/theme";
import { ageAtDate, formatDate, formatDateShort, pregnancyWeek } from "../../utils/dates";
import { buildTimeline, formatMeasurement, momentColor, momentEmoji, momentTitle, TimelineItem } from "../../utils/moments";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayButton, Squish } from "../../components/ui/Clay";
import { MomentPicture } from "../../components/MomentBits";

const HEIGHTS: Record<TimelineItem["kind"], number> = {
  chapter: 92,
  start: 132,
  moment: 150,
  growth: 112,
  today: 150,
};

export default function TimelineScreen() {
  const { active } = useFamily();
  if (!active) {
    return (
      <Screen bottomSpace={TAB_BAR_SPACE}>
        <Header title="Weg" back={false} />
        <Text style={type.body}>Lege zuerst ein Kind an — dann beginnt hier sein Weg.</Text>
        <ClayButton label="Kind anlegen" icon="add" onPress={() => router.push("/kind/neu")} style={{ marginTop: 20 }} />
      </Screen>
    );
  }
  return <Timeline child={active} />;
}

function Timeline({ child }: { child: Child }) {
  const { moments, growth } = useChildData(child.id);
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const didScroll = useRef(false);
  const urls = usePhotoUrls(moments.map((m) => m.photos[0]));

  const W = Math.min(width, 520) - 40; // Inhaltbreite (20px Rand je Seite)
  const items = useMemo(() => buildTimeline(child, moments, growth), [child, moments, growth]);

  // Positionen: Knoten abwechselnd links/rechts, Kapitel mittig
  const layout = useMemo(() => {
    let y = 0;
    let side = 0;
    return items.map((item) => {
      const h = HEIGHTS[item.kind];
      const centered = item.kind === "chapter";
      const left = side % 2 === 0;
      if (!centered) side++;
      const x = centered ? W / 2 : left ? W * 0.2 : W * 0.8;
      const pos = { item, top: y, height: h, x, cy: y + h / 2, left, centered };
      y += h;
      return pos;
    });
  }, [items, W]);
  const total = layout.length ? layout[layout.length - 1].top + layout[layout.length - 1].height : 0;

  const path = useMemo(() => {
    if (layout.length < 2) return "";
    let d = `M ${layout[0].x} ${layout[0].cy}`;
    for (let i = 1; i < layout.length; i++) {
      const a = layout[i - 1];
      const b = layout[i];
      const dy = (b.cy - a.cy) / 2;
      d += ` C ${a.x} ${a.cy + dy}, ${b.x} ${b.cy - dy}, ${b.x} ${b.cy}`;
    }
    return d;
  }, [layout]);

  const count = moments.length;
  const subtitle =
    count === 0 && growth.length === 0
      ? "Hier wächst eure Geschichte"
      : [`${count} ${count === 1 ? "Moment" : "Momente"}`, growth.length ? `${growth.length} ${growth.length === 1 ? "Messung" : "Messungen"}` : null]
          .filter(Boolean)
          .join(" · ");

  return (
    <Screen
      bottomSpace={TAB_BAR_SPACE}
      scrollRef={scrollRef}
      contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}
    >
      <Header
        title={`${child.name}s Weg`}
        subtitle={subtitle}
        back={false}
        right={
          <Squish onPress={() => router.push("/(tabs)/buch")} accessibilityRole="button" accessibilityLabel="Buch" style={[styles.bookBtn, clayButton(colors.sun)]}>
            <Ionicons name="book" size={18} color={colors.ink} />
            <Text style={styles.bookText}>Buch</Text>
          </Squish>
        }
      />

      <View
        style={{ height: total, width: W }}
        onLayout={() => {
          if (!didScroll.current && moments.length > 3) {
            didScroll.current = true;
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
          }
        }}
      >
        <Svg width={W} height={total} style={StyleSheet.absoluteFill}>
          <Path d={path} fill="none" stroke={tint(child.color, 0.22)} strokeWidth={22} strokeLinecap="round" />
          <Path d={path} fill="none" stroke={colors.surface} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 14" />
        </Svg>

        {layout.map((p) => (
          <View key={p.item.key} style={[styles.slot, { top: p.top, height: p.height }]}>
            <Node child={child} pos={p} W={W} photo={p.item.kind === "moment" ? urls[p.item.moment.photos[0]] : undefined} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

function Node({
  child,
  pos,
  W,
  photo,
}: {
  child: Child;
  pos: { item: TimelineItem; x: number; height: number; left: boolean };
  W: number;
  photo?: string;
}) {
  const { item, x, left } = pos;
  const birth = child.kind === "baby" ? child.profile.birthDate : null;

  // Kapitel: Wegweiser mittig auf dem Pfad
  if (item.kind === "chapter") {
    return (
      <View style={[styles.chapterWrap]}>
        <View style={[styles.chapter, clay(child.color, "soft")]}>
          <Text style={{ fontSize: 20 }}>{item.chapter.emoji}</Text>
          <View>
            <Text style={styles.chapterTitle}>{item.chapter.title}</Text>
            <Text style={styles.chapterSub}>{item.chapter.subtitle}</Text>
          </View>
        </View>
      </View>
    );
  }

  const bubble = item.kind === "moment" ? 88 : item.kind === "growth" ? 62 : 76;
  const labelWidth = W - (left ? x + bubble / 2 + 14 : W - x + bubble / 2 + 14);
  const bubbleStyle = { position: "absolute" as const, left: x - bubble / 2, top: (pos.height - bubble) / 2 };
  const labelStyle = left
    ? { position: "absolute" as const, left: x + bubble / 2 + 14, width: labelWidth, top: 0, bottom: 0, justifyContent: "center" as const }
    : { position: "absolute" as const, right: W - x + bubble / 2 + 14, width: labelWidth, top: 0, bottom: 0, justifyContent: "center" as const, alignItems: "flex-end" as const };
  const align = left ? ("left" as const) : ("right" as const);

  if (item.kind === "start") {
    const isBaby = child.kind === "baby";
    return (
      <>
        <View style={[bubbleStyle, styles.round, { width: bubble, height: bubble, backgroundColor: colors.sun }, clayButton(colors.sun)]}>
          <Ionicons name={isBaby ? "heart" : "sparkles"} size={32} color={colors.onAccent} />
        </View>
        <View style={labelStyle}>
          <Text style={[styles.nodeTitle, { textAlign: align }]}>{isBaby ? "Hallo Welt!" : "Wir erwarten dich"}</Text>
          <Text style={[styles.nodeSub, { textAlign: align }]}>{formatDate(item.dateISO)}</Text>
        </View>
      </>
    );
  }

  if (item.kind === "today") {
    const sub =
      child.kind === "baby"
        ? "Was erlebt ihr gerade?"
        : `SSW ${pregnancyWeek(child.profile.dueDate).week} · Termin ${formatDateShort(child.profile.dueDate)}`;
    return (
      <>
        <Squish
          onPress={() => router.push(`/moment/neu?child=${child.id}`)}
          accessibilityRole="button"
          accessibilityLabel="Neuen Moment festhalten"
          style={[bubbleStyle, styles.round, { width: bubble, height: bubble, backgroundColor: child.color }, clayButton(child.color)]}
        >
          <Ionicons name="add" size={36} color={colors.onAccent} />
        </Squish>
        <View style={labelStyle}>
          <Text style={[styles.nodeTitle, { textAlign: align }]}>Heute</Text>
          <Text style={[styles.nodeSub, { textAlign: align }]}>{sub}</Text>
        </View>
      </>
    );
  }

  if (item.kind === "growth") {
    const g = item.entry;
    return (
      <>
        <Squish
          onPress={() => router.push(`/messung?child=${child.id}&id=${g.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Messung ${formatMeasurement(g)}`}
          style={[bubbleStyle, styles.round, styles.growthBubble, { width: bubble, height: bubble }, clay(colors.sky, "soft")]}
        >
          <Ionicons name="resize" size={24} color={colors.sky} />
        </Squish>
        <View style={labelStyle}>
          <View style={[styles.growthTag, clay(colors.sky, "soft")]}>
            <Text style={styles.growthText}>{formatMeasurement(g)}</Text>
          </View>
          <Text style={[styles.nodeSub, { textAlign: align, marginTop: 6 }]}>
            {g.note ? `${g.note} · ` : ""}
            {formatDateShort(g.measuredOn)}
          </Text>
        </View>
      </>
    );
  }

  // Moment
  const m = item.moment;
  const tilt = left ? -4 : 4;
  return (
    <>
      <Squish
        onPress={() => router.push(`/moment/${m.id}?child=${child.id}`)}
        accessibilityRole="button"
        accessibilityLabel={momentTitle(m)}
        style={[bubbleStyle, { width: bubble, height: bubble, transform: [{ rotate: `${tilt}deg` }] }]}
      >
        <View style={[styles.photoBubble, clay(momentColor(m), "normal")]}>
          <MomentPicture photo={photo} emoji={momentEmoji(m)} color={momentColor(m)} style={styles.photoInner} emojiSize={34} />
        </View>
        {photo ? (
          <View style={[styles.emojiBadge, { backgroundColor: momentColor(m) }]}>
            <Text style={{ fontSize: 14 }}>{momentEmoji(m)}</Text>
          </View>
        ) : null}
      </Squish>
      <View style={labelStyle}>
        <Text style={[styles.nodeTitle, { textAlign: align }]} numberOfLines={2}>
          {momentTitle(m)}
        </Text>
        <Text style={[styles.nodeSub, { textAlign: align }]}>
          {birth ? ageAtDate(birth, m.happenedOn) : `SSW ${pregnancyWeek((child.profile as { dueDate: string }).dueDate, m.happenedOn).week}`}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: colors.sun,
  },
  bookText: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  slot: { position: "absolute", left: 0, right: 0 },
  round: { borderRadius: 999, alignItems: "center", justifyContent: "center" },
  chapterWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  chapter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 18,
  },
  chapterTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  chapterSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  nodeTitle: { fontFamily: fonts.display, fontSize: 17, lineHeight: 21, color: colors.ink },
  nodeSub: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.inkSoft, marginTop: 2 },
  growthBubble: { backgroundColor: colors.skySoft, borderWidth: 4, borderColor: colors.surface },
  growthTag: { backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  growthText: { fontFamily: fonts.display, fontSize: 14, color: colors.skyDeep },
  photoBubble: { flex: 1, borderRadius: 30, borderWidth: 5, borderColor: colors.surface, backgroundColor: colors.surface, overflow: "hidden" },
  photoInner: { flex: 1, borderRadius: 24 },
  emojiBadge: {
    position: "absolute",
    right: -8,
    top: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },
});
