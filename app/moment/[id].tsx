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
import { colors, elevation, emoji, radius, size, soft, solid, space } from "../../utils/theme";
import { announce } from "../../utils/a11y";
import { Header, Screen } from "../../components/ui/Screen";
import { ClayButton, ClayCard, IconButton, Pill } from "../../components/ui/Clay";
import { Confetti } from "../../components/Confetti";
import { T } from "../../components/ui/T";

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
    if (party) {
      celebrate();
      announce("Moment gespeichert");
    }
  }, []);

  if (!child || moment === undefined) {
    return (
      <Screen>
        <ActivityIndicator color={colors.coral} style={{ marginTop: space.xxl }} />
      </Screen>
    );
  }

  if (moment === null) {
    return (
      <Screen>
        <Header title="Nicht gefunden" />
        <T variant="body">Diesen Moment gibt es nicht mehr.</T>
      </Screen>
    );
  }

  const color = momentColor(moment);
  const milestone = findMilestone(moment.milestoneId);
  const slideWidth = Math.min(width, 560) - 2 * space.gutter;
  const title = momentTitle(moment);
  const count = moment.photos.length;
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
          <View style={[styles.gallery, elevation.float]}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32}>
              {moment.photos.map((ref, i) => (
                <View key={ref} style={{ width: slideWidth - 16, height: slideWidth - 16 }}>
                  {urls[ref] ? (
                    <Image
                      source={{ uri: urls[ref] }}
                      style={styles.photo}
                      accessible
                      accessibilityRole="image"
                      accessibilityLabel={count > 1 ? `Foto ${i + 1} von ${count} – ${title}` : `Foto – ${title}`}
                    />
                  ) : (
                    <View style={[styles.photo, { backgroundColor: soft(color) }]} />
                  )}
                </View>
              ))}
            </ScrollView>
            {count > 1 && (
              <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {moment.photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === page && { backgroundColor: solid(color), width: space.md + 2 }]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.sticker, { backgroundColor: soft(color) }]}>
            <Text style={emoji(96)} accessibilityElementsHidden importantForAccessibility="no">
              {momentEmoji(moment)}
            </Text>
          </View>
        )}

        <View style={styles.meta}>
          <Pill label={`${momentEmoji(moment)}  ${age}`} color={color} background={soft(color)} />
          <T variant="title" accessibilityRole="header">
            {title}
          </T>
          <T variant="body">
            {formatDate(moment.happenedOn)}
            {milestone ? ` · ${CATEGORY_LABELS[milestone.category]}` : ""}
          </T>
        </View>

        {moment.note ? (
          <ClayCard style={styles.note}>
            <Ionicons name="chatbubble-ellipses" size={size.icon.md} color={color} style={{ marginBottom: space.xs }} />
            <T variant="bodyLong" color={colors.ink}>
              {moment.note}
            </T>
          </ClayCard>
        ) : (
          <ClayCard
            color={colors.surfaceSoft}
            lift="flat"
            style={styles.emptyNote}
            onPress={() => router.push(`/moment/bearbeiten?child=${child.id}&entry=${moment.id}`)}
            accessibilityLabel="Notiz hinzufügen"
          >
            <Ionicons name="create-outline" size={size.icon.md} color={solid(color)} />
            <T variant="body" style={{ flex: 1 }}>
              Noch keine Notiz — was möchtet ihr über diesen Moment nie vergessen?
            </T>
          </ClayCard>
        )}

        <ClayButton
          label="Im Zeitstrahl ansehen"
          icon="trail-sign"
          variant="soft"
          color={color}
          onPress={() => router.navigate("/(tabs)/zeitstrahl")}
          style={{ marginTop: space.lg }}
        />
      </Screen>
      {party && <Confetti onDone={() => setParty(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: space.xs, overflow: "hidden" },
  photo: { width: "100%", height: "100%", borderRadius: radius.lg },
  dots: { flexDirection: "row", justifyContent: "center", gap: space.xxs + 2, paddingTop: space.sm, paddingBottom: space.xxs },
  dot: { width: space.xs, height: space.xs, borderRadius: radius.pill, backgroundColor: colors.line },
  sticker: { height: 240, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  meta: { gap: space.xs, marginTop: space.lg, marginBottom: space.md },
  note: { paddingVertical: space.md + 2 },
  emptyNote: { flexDirection: "row", alignItems: "center", gap: space.sm, borderWidth: 2, borderColor: colors.line },
});
