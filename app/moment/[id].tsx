// ─── Ein Moment in groß ──────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MomentEntry } from "../../types";
import { useChild } from "../../utils/family";
import { loadMoment } from "../../utils/storage";
import { usePhotoUrls } from "../../utils/usePhotoUrls";
import { findMilestone, momentColor, momentEmoji, momentTitle } from "../../utils/moments";
import { CATEGORY_LABELS } from "../../utils/milestoneData";
import { ageAtDate, formatDate, pregnancyWeek } from "../../utils/dates";
import { celebrate } from "../../utils/haptics";
import { colors, clay, fonts, radius, tint, type } from "../../utils/theme";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayButton, ClayCard, IconButton, Pill } from "../../components/ui/Clay";
import { Confetti } from "../../components/Confetti";

export default function MomentDetailScreen() {
  const params = useLocalSearchParams<{ id: string; child?: string; neu?: string }>();
  const child = useChild(params.child);
  const [moment, setMoment] = useState<MomentEntry | null | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [party, setParty] = useState(params.neu === "1");
  const { width } = useWindowDimensions();
  const urls = usePhotoUrls(moment?.photos ?? []);

  useFocusEffect(
    useCallback(() => {
      if (!child) return;
      loadMoment(child.id, params.id).then(setMoment).catch(() => setMoment(null));
    }, [child?.id, params.id])
  );

  useEffect(() => {
    if (party) celebrate();
  }, []);

  if (!child || moment === undefined) {
    return (
      <Screen>
        <ActivityIndicator color={colors.coral} style={{ marginTop: 80 }} />
      </Screen>
    );
  }

  if (moment === null) {
    return (
      <Screen>
        <Header title="Nicht gefunden" />
        <Text style={type.body}>Diesen Moment gibt es nicht mehr.</Text>
      </Screen>
    );
  }

  const color = momentColor(moment);
  const milestone = findMilestone(moment.milestoneId);
  const slideWidth = Math.min(width, 560) - 40;
  const age =
    child.kind === "baby"
      ? ageAtDate(child.profile.birthDate, moment.happenedOn)
      : `in SSW ${pregnancyWeek(child.profile.dueDate, moment.happenedOn).week}`;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / (slideWidth - 16)));

  return (
    <View style={{ flex: 1 }}>
      <Screen contentStyle={{ maxWidth: 560, width: "100%", alignSelf: "center" }}>
        <Header
          right={
            <IconButton
              icon="create-outline"
              label="Bearbeiten"
              onPress={() => router.push(`/moment/bearbeiten?child=${child.id}&entry=${moment.id}`)}
            />
          }
        />

        {moment.photos.length > 0 ? (
          <View style={[styles.gallery, clay(color, "normal")]}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32}>
              {moment.photos.map((ref) => (
                <View key={ref} style={{ width: slideWidth - 16, height: slideWidth - 16, marginRight: 0 }}>
                  {urls[ref] ? (
                    <Image source={{ uri: urls[ref] }} style={styles.photo} accessibilityLabel={momentTitle(moment)} />
                  ) : (
                    <View style={[styles.photo, { backgroundColor: tint(color, 0.15) }]} />
                  )}
                </View>
              ))}
            </ScrollView>
            {moment.photos.length > 1 && (
              <View style={styles.dots}>
                {moment.photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === page && { backgroundColor: color, width: 18 }]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.sticker, { backgroundColor: tint(color, 0.16) }]}>
            <Text style={{ fontSize: 96 }}>{momentEmoji(moment)}</Text>
          </View>
        )}

        <View style={styles.meta}>
          <Pill label={`${momentEmoji(moment)}  ${age}`} color={color} background={tint(color, 0.14)} />
          <Text style={[type.hero, { fontSize: 34, lineHeight: 40 }]}>{momentTitle(moment)}</Text>
          <Text style={styles.date}>
            {formatDate(moment.happenedOn)}
            {milestone ? ` · ${CATEGORY_LABELS[milestone.category]}` : ""}
          </Text>
        </View>

        {moment.note ? (
          <ClayCard style={styles.note}>
            <Ionicons name="chatbubble-ellipses" size={20} color={tint(color, 0.7)} style={{ marginBottom: 6 }} />
            <Text style={styles.noteText}>{moment.note}</Text>
          </ClayCard>
        ) : (
          <ClayCard color={colors.surfaceSoft} strength="soft" onPress={() => router.push(`/moment/bearbeiten?child=${child.id}&entry=${moment.id}`)} accessibilityLabel="Notiz hinzufügen">
            <Text style={type.body}>Noch keine Notiz — was möchtest du über diesen Moment nie vergessen?</Text>
          </ClayCard>
        )}

        <ClayButton
          label="Im Zeitstrahl ansehen"
          icon="trail-sign"
          variant="soft"
          color={color}
          onPress={() => router.navigate("/(tabs)/zeitstrahl")}
          style={{ marginTop: 22 }}
        />
      </Screen>
      {party && <Confetti onDone={() => setParty(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 8, overflow: "hidden" },
  photo: { width: "100%", height: "100%", borderRadius: radius.lg },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingTop: 10, paddingBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  sticker: { height: 240, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  meta: { gap: 8, marginTop: 22, marginBottom: 18 },
  date: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.inkSoft },
  note: { paddingVertical: 18 },
  noteText: { fontFamily: fonts.body, fontSize: 17, lineHeight: 26, color: colors.ink },
});
