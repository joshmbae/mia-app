// ─── Mia Design-Tokens: "Kuschelwolke" ───────────────────────────────────────
// Weich, rund, knuddelig: Pfirsich-Creme als Grund, Clay-Flächen mit
// sanften Innen- und Außenschatten, kräftig-freundliche Akzentfarben.
// Alle Screens nutzen diese Tokens — keine freien Hex-Werte in Screens.

import { Platform, TextStyle, ViewStyle } from "react-native";

export const colors = {
  bg: "#FFF3EA",
  bgDeep: "#FFE9DC",
  surface: "#FFFFFF",
  surfaceSoft: "#FFF8F3",
  line: "#F2DFD3",
  ink: "#3B2F3A",
  inkSoft: "#6E5E6A",
  muted: "#A797A2",
  onAccent: "#FFFFFF",

  coral: "#E2725B",
  coralDeep: "#C4573F",
  coralSoft: "#FFE1D2",
  peach: "#F6B9A4",

  sun: "#FFD66B",
  honey: "#F2A541",
  sunDeep: "#B07812",
  sunSoft: "#FFF6D9",

  sky: "#4F94D4",
  skyDeep: "#2F6EA8",
  skySoft: "#E3F1FF",

  mint: "#3FA38A",
  mintDeep: "#2F7A58",
  mintSoft: "#EAF6EF",

  lilac: "#8C6CD9",
  lilacDeep: "#6A4DB8",
  lilacSoft: "#EFE9FB",

  danger: "#D9534F",
};

/** Farben, aus denen Eltern die Farbe ihres Kindes wählen */
export const CHILD_COLORS = ["#E2725B", "#4F94D4", "#3FA38A", "#8C6CD9", "#F2A541", "#E8789A"];

export const fonts = {
  display: "Fredoka_600SemiBold",
  displayBold: "Fredoka_700Bold",
  displayMedium: "Fredoka_500Medium",
  body: "Nunito_600SemiBold",
  bodyBold: "Nunito_700Bold",
  bodyHeavy: "Nunito_800ExtraBold",
};

export const radius = { sm: 14, md: 20, lg: 28, xl: 36, pill: 999 };

export const space = { xs: 6, sm: 10, md: 16, lg: 20, xl: 28 };

/** Hex-Farbe mit Alpha (0–1) */
export function tint(hex: string, alpha: number): string {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
}

/**
 * Clay-Look: weicher farbiger Außenschatten plus Innenlicht oben links und
 * Innenschatten unten rechts. `glow` ist die Farbe des Außenschattens.
 */
export function clay(glow: string = colors.coral, strength: "soft" | "normal" | "strong" = "normal"): ViewStyle {
  const a = strength === "soft" ? 0.12 : strength === "strong" ? 0.38 : 0.18;
  const y = strength === "soft" ? 6 : strength === "strong" ? 12 : 10;
  const blur = strength === "soft" ? 14 : strength === "strong" ? 22 : 20;
  return {
    boxShadow: [
      `0px ${y}px ${blur}px ${tint(glow, a)}`,
      "inset -5px -6px 12px rgba(0,0,0,0.05)",
      "inset 5px 5px 10px rgba(255,255,255,0.75)",
    ].join(", "),
  } as ViewStyle;
}

/** Clay-Look für farbige Knöpfe: dunklerer Innenschatten, hellerer Glanz */
export function clayButton(color: string): ViewStyle {
  return {
    boxShadow: [
      `0px 10px 20px ${tint(color, 0.38)}`,
      "inset -5px -6px 10px rgba(0,0,0,0.12)",
      "inset 5px 5px 10px rgba(255,255,255,0.35)",
    ].join(", "),
  } as ViewStyle;
}

export const type = {
  hero: { fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 44, color: colors.ink } as TextStyle,
  h1: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 32, color: colors.ink } as TextStyle,
  h2: { fontFamily: fonts.display, fontSize: 21, lineHeight: 26, color: colors.ink } as TextStyle,
  h3: { fontFamily: fonts.display, fontSize: 17, lineHeight: 22, color: colors.ink } as TextStyle,
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkSoft } as TextStyle,
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 22, color: colors.ink } as TextStyle,
  small: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18, color: colors.inkSoft } as TextStyle,
  label: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 11.5,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.muted,
  } as TextStyle,
};

/** Weißraum unter der schwebenden Tab-Leiste */
export const TAB_BAR_SPACE = Platform.OS === "web" ? 120 : 130;
