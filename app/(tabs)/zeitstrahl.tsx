import React, { useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Child } from "../../types";
import { useFamily } from "../../utils/family";
import { useChildData } from "../../utils/useChildData";
import { usePhotoUrls } from "../../utils/usePhotoUrls";
import { colors, ctaShadow, elevation, emoji, radius, size, soft, solid, space, tint } from "../../utils/theme";
import { ageAtDate, formatDate, formatDateShort, pregnancyWeek } from "../../utils/dates";
import { buildTimeline, formatMeasurement, momentColor, momentEmoji, momentTitle, TimelineItem } from "../../utils/moments";
import { Header, Screen, useTabBarSpace } from "../../components/ui/Screen";
import { ClayButton, Squish } from "../../components/ui/Clay";
import { T } from "../../components/ui/T";
import { MomentPicture } from "../../components/MomentBits";

/** Feste Slot-Höhen: Texte im Pfad dürfen nur begrenzt mitwachsen */
const NODE_FONT_SCALE = 1.2;

const HEIGHTS: Record<TimelineItem["kind"], number> = {
  chapter: 92,
  start: 132,
  moment: 150,
  growth: 112,
  today: 150,
};

export default function TimelineScreen() {
  const { active } = useFamily();
  const bottomSpace = useTabBarSpace();
  if (!active) {
    return (
      <Screen bottomSpace={bottomSpace}>
        <Header title="Weg" back={false} />
        <T variant="body">Legt zuerst ein Kind an — dann beginnt hier sein Weg.</T>
        <ClayButton label="Kind anlegen" icon="add" onPress={() => router.push("/kind/neu")} style={{ marginTop: space.gutter }} />
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
  const bottomSpace = useTabBarSpace();

  const W = Math.min(width, 520) - 2 * space.gutter; // Inhaltsbreite (Seitenrand je Seite)
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
      bottomSpace={bottomSpace}
      scrollRef={scrollRef}
      contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}
    >
      <Header
        title={`${child.name}s Weg`}
        subtitle={subtitle}
        back={false}
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
        <View style={[styles.chapter, elevation.raised]} accessible accessibilityRole="header" accessibilityLabel={`${item.chapter.title}, ${item.chapter.subtitle}`}>
          <Text style={emoji(20)}>{item.chapter.emoji}</Text>
          <View style={{ flexShrink: 1 }}>
            <T variant="h3" numberOfLines={1} maxFontSizeMultiplier={NODE_FONT_SCALE}>
              {item.chapter.title}
            </T>
            <T variant="caption" numberOfLines={1} maxFontSizeMultiplier={NODE_FONT_SCALE}>
              {item.chapter.subtitle}
            </T>
          </View>
        </View>
      </View>
    );
  }

  const bubble = item.kind === "moment" ? 88 : item.kind === "growth" ? 62 : 76;
  const gap = space.sm;
  const labelWidth = W - (left ? x + bubble / 2 + gap : W - x + bubble / 2 + gap);
  const bubbleStyle = { position: "absolute" as const, left: x - bubble / 2, top: (pos.height - bubble) / 2 };
  const labelStyle = {
    position: "absolute" as const,
    width: labelWidth,
    top: 0,
    bottom: 0,
    justifyContent: "center" as const,
    // Titel, Wachstums-Etikett und Meta-Zeile hängen immer an derselben Seite
    alignItems: left ? ("flex-start" as const) : ("flex-end" as const),
    ...(left ? { left: x + bubble / 2 + gap } : { right: W - x + bubble / 2 + gap }),
  };
  const align = left ? ("left" as const) : ("right" as const);

  if (item.kind === "start") {
    const isBaby = child.kind === "baby";
    return (
      <>
        <View style={[bubbleStyle, styles.round, styles.ringed, { width: bubble, height: bubble, backgroundColor: colors.sunSoft }, elevation.raised]}>
          <Ionicons name={isBaby ? "heart" : "sparkles"} size={size.icon.lg} color={colors.sunDeep} />
        </View>
        <View style={labelStyle}>
          <NodeTitle align={align}>{isBaby ? "Hallo Welt!" : "Wir erwarten dich"}</NodeTitle>
          <NodeSub align={align}>{formatDate(item.dateISO)}</NodeSub>
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
          haptic
          style={[bubbleStyle, styles.round, { width: bubble, height: bubble, backgroundColor: solid(child.color) }, ctaShadow(child.color)]}
        >
          <Ionicons name="add" size={size.icon.lg + space.xs} color={colors.onAccent} />
        </Squish>
        <View style={labelStyle}>
          <NodeTitle align={align}>Heute</NodeTitle>
          <NodeSub align={align}>{sub}</NodeSub>
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
          style={[bubbleStyle, styles.round, styles.ringed, { width: bubble, height: bubble, backgroundColor: colors.skySoft }, elevation.raised]}
        >
          <Ionicons name="resize" size={size.icon.md} color={solid(colors.sky)} />
        </Squish>
        <View style={labelStyle}>
          <View style={styles.growthTag}>
            <T variant="chip" color={solid(colors.sky)} numberOfLines={1} maxFontSizeMultiplier={NODE_FONT_SCALE}>
              {formatMeasurement(g)}
            </T>
          </View>
          <NodeSub align={align} style={{ marginTop: space.xs }}>
            {g.note ? `${g.note} · ` : ""}
            {formatDateShort(g.measuredOn)}
          </NodeSub>
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
        <View style={[styles.photoBubble, elevation.raised]}>
          <MomentPicture photo={photo} emoji={momentEmoji(m)} color={momentColor(m)} style={styles.photoInner} emojiSize={32} label={momentTitle(m)} />
        </View>
        {photo ? (
          <View style={[styles.emojiBadge, { backgroundColor: soft(momentColor(m)) }]}>
            <Text style={emoji(16)} accessibilityElementsHidden importantForAccessibility="no">
              {momentEmoji(m)}
            </Text>
          </View>
        ) : null}
      </Squish>
      <View style={labelStyle}>
        <NodeTitle align={align} lines={2}>
          {momentTitle(m)}
        </NodeTitle>
        <NodeSub align={align}>
          {birth ? ageAtDate(birth, m.happenedOn) : `SSW ${pregnancyWeek((child.profile as { dueDate: string }).dueDate, m.happenedOn).week}`}
        </NodeSub>
      </View>
    </>
  );
}

function NodeTitle({ children, align, lines }: { children: React.ReactNode; align: "left" | "right"; lines?: number }) {
  return (
    <T variant="h3" align={align} numberOfLines={lines} maxFontSizeMultiplier={NODE_FONT_SCALE}>
      {children}
    </T>
  );
}

function NodeSub({ children, align, style }: { children: React.ReactNode; align: "left" | "right"; style?: object }) {
  return (
    <T variant="caption" color={colors.inkSoft} align={align} numberOfLines={2} maxFontSizeMultiplier={NODE_FONT_SCALE} style={[{ marginTop: space.xxs / 2 }, style]}>
      {children}
    </T>
  );
}

const styles = StyleSheet.create({
  slot: { position: "absolute", left: 0, right: 0 },
  round: { borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  ringed: { borderWidth: space.xxs, borderColor: colors.surface },
  chapterWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: space.md },
  chapter: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    maxWidth: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingLeft: space.md,
    paddingRight: space.gutter,
  },
  growthTag: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs + 2,
    maxWidth: "100%",
  },
  photoBubble: { flex: 1, borderRadius: radius.lg, borderWidth: space.xxs + 1, borderColor: colors.surface, backgroundColor: colors.surface, overflow: "hidden" },
  photoInner: { flex: 1, borderRadius: radius.md + space.xxs - 1 },
  emojiBadge: {
    position: "absolute",
    right: -space.xs,
    top: -space.xs,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },
});
