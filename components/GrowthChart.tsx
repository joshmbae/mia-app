// ─── Wachstumskurve: nur der eigene Verlauf, Momente als Bläschen ────────────

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, fonts, tint } from "../utils/theme";
import { parseISODate } from "../utils/dates";
import { Squish } from "./ui/Clay";

export interface ChartPoint {
  date: string;
  value: number;
}

export interface ChartMoment {
  id: string;
  date: string;
  emoji: string;
  color: string;
  title: string;
}

const H = 200;
const PAD_X = 14;
const PAD_TOP = 34;
const PAD_BOTTOM = 14;

export function GrowthChart({
  points,
  moments,
  width,
  color,
  startLabel,
  endLabel,
  onMomentPress,
}: {
  points: ChartPoint[];
  moments: ChartMoment[];
  width: number;
  color: string;
  startLabel: string;
  endLabel: string;
  onMomentPress: (id: string) => void;
}) {
  if (points.length === 0) return null;

  const t = (iso: string) => parseISODate(iso).getTime();
  const t0 = t(points[0].date);
  const t1 = Math.max(t(points[points.length - 1].date), t0 + 1);
  const values = points.map((p) => p.value);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const span = Math.max(vMax - vMin, vMax * 0.08, 1);
  const lo = vMin - span * 0.12;
  const hi = vMax + span * 0.12;

  const x = (iso: string) => PAD_X + ((t(iso) - t0) / (t1 - t0)) * (width - PAD_X * 2);
  const y = (v: number) => PAD_TOP + (1 - (v - lo) / (hi - lo)) * (H - PAD_TOP - PAD_BOTTOM);

  const xy = points.map((p) => ({ x: points.length === 1 ? width / 2 : x(p.date), y: y(p.value) }));
  let line = `M ${xy[0].x} ${xy[0].y}`;
  for (let i = 1; i < xy.length; i++) {
    const a = xy[i - 1];
    const b = xy[i];
    const dx = (b.x - a.x) / 2;
    line += ` C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  }
  const area = `${line} L ${xy[xy.length - 1].x} ${H} L ${xy[0].x} ${H} Z`;

  // Wert der Kurve an einem Datum (linear zwischen Messungen)
  const valueAt = (iso: string) => {
    const tt = t(iso);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      if (tt <= t(b.date)) {
        const f = (tt - t(a.date)) / Math.max(t(b.date) - t(a.date), 1);
        return a.value + f * (b.value - a.value);
      }
    }
    return points[points.length - 1].value;
  };

  const shown = points.length > 1 ? moments.filter((m) => t(m.date) >= t0 && t(m.date) <= t1).slice(-8) : [];

  return (
    <View style={{ width, height: H + 22 }}>
      <Svg width={width} height={H} accessibilityLabel="Wachstumskurve">
        <Path d={area} fill={tint(color, 0.16)} />
        <Path d={line} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {xy.map((p, i) => {
          const last = i === xy.length - 1;
          return (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={last ? 8 : 6}
              fill={last ? color : colors.surface}
              stroke={last ? colors.surface : color}
              strokeWidth={last ? 4 : 3.5}
            />
          );
        })}
      </Svg>
      {shown.map((m) => {
        const cx = x(m.date);
        const cy = y(valueAt(m.date)) - 26;
        return (
          <Squish
            key={m.id}
            onPress={() => onMomentPress(m.id)}
            accessibilityRole="button"
            accessibilityLabel={m.title}
            style={[styles.bubble, { left: cx - 15, top: Math.max(0, cy - 15), backgroundColor: tint(m.color, 0.9) }]}
          >
            <Text style={{ fontSize: 13 }}>{m.emoji}</Text>
          </Squish>
        );
      })}
      <View style={styles.axis}>
        <Text style={styles.axisText}>{startLabel}</Text>
        <Text style={styles.axisText}>{endLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: colors.surface,
  },
  axis: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4, marginTop: 4 },
  axisText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.muted },
});
