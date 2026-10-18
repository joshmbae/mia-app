// ─── Mia Design-Tokens: "Kuschelwolke" ───────────────────────────────────────
// Weich, rund, knuddelig — aber ruhig und gut lesbar. Regeln:
// • Schrift nur über `type` (bzw. die <T>-Komponente), keine freien Größen.
// • Abstände nur aus `space`, Radien nur aus `radius`.
// • Schatten nur über `elevation`: Nur schwebende Dinge leuchten, alles was
//   auf einer Fläche liegt, bleibt flach oder ist eingedrückt (Eingabefelder).
// • Weiße Schrift steht immer auf der dunklen Füllfarbe `solid(farbe)`.

import { TextStyle, ViewStyle } from "react-native";

export const colors = {
  bg: "#FFF3EA",
  bgDeep: "#FFE9DC",
  surface: "#FFFFFF",
  surfaceSoft: "#FFF8F3",
  line: "#F2DFD3",
  ink: "#3B2F3A",
  inkSoft: "#5F505C",
  muted: "#7D6B78",      // Labels & Nebentexte (≥ 4,5:1 auf bg)
  faint: "#B3A3AE",      // nur Platzhalter & Dekoration
  onAccent: "#FFFFFF",

  coral: "#E2725B",
  coralDeep: "#C74F3B",
  coralSoft: "#FFE1D2",
  peach: "#F6B9A4",

  sun: "#FFD66B",
  honey: "#F2A541",
  sunDeep: "#A65A0C",
  sunSoft: "#FFF6D9",

  sky: "#4F94D4",
  skyDeep: "#2F6EA8",
  skySoft: "#E3F1FF",

  mint: "#3FA38A",
  mintDeep: "#2F7A58",
  mintSoft: "#EAF6EF",

  lilac: "#8C6CD9",
  lilacDeep: "#7354C4",
  lilacSoft: "#EFE9FB",

  pink: "#E8789A",
  pinkDeep: "#B84A6E",
  pinkSoft: "#FDE7EE",

  danger: "#C2412F",
};

/** Farben, aus denen Eltern die Farbe ihres Kindes wählen */
export const CHILD_COLORS = [colors.coral, colors.sky, colors.mint, colors.lilac, colors.honey, colors.pink];

export const COLOR_NAMES: Record<string, string> = {
  [colors.coral]: "Koralle",
  [colors.sky]: "Himmelblau",
  [colors.mint]: "Minze",
  [colors.lilac]: "Flieder",
  [colors.honey]: "Honig",
  [colors.pink]: "Rosa",
};

const SOLID: Record<string, string> = {
  [colors.coral]: colors.coralDeep,
  [colors.sky]: colors.skyDeep,
  [colors.mint]: colors.mintDeep,
  [colors.lilac]: colors.lilacDeep,
  [colors.honey]: colors.sunDeep,
  [colors.sun]: colors.sunDeep,
  [colors.pink]: colors.pinkDeep,
  "#B36BC2": "#8E4A9D",
  "#F07B6E": colors.coralDeep,
  "#E8789A": colors.pinkDeep,
};

const SOFT: Record<string, string> = {
  [colors.coral]: colors.coralSoft,
  [colors.sky]: colors.skySoft,
  [colors.mint]: colors.mintSoft,
  [colors.lilac]: colors.lilacSoft,
  [colors.honey]: colors.sunSoft,
  [colors.sun]: colors.sunSoft,
  [colors.pink]: colors.pinkSoft,
};

function mix(hex: string, target: number, amount: number): string {
  const h = hex.replace("#", "");
  const ch = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (
    "#" +
    ch
      .map((c) => Math.round(c + (target - c) * amount))
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Dunkle Füllfarbe einer Akzentfarbe — darauf ist weiße Schrift gut lesbar (≥ 4,5:1) */
export function solid(color: string): string {
  return SOLID[color] ?? mix(color, 0, 0.3);
}

/** Deckende, sehr helle Variante einer Akzentfarbe — für Kartenflächen (nie Transparenz) */
export function soft(color: string): string {
  return SOFT[color] ?? mix(color, 255, 0.85);
}

/** Hex-Farbe mit Alpha (0–1) — nur für Schatten & Dekoration, nie für Flächen mit Text */
export function tint(hex: string, alpha: number): string {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
}

// ─── Schrift ──────────────────────────────────────────────────────────────────

export const fonts = {
  display: "Fredoka_600SemiBold",
  displayBold: "Fredoka_700Bold",
  displayMedium: "Fredoka_500Medium",
  body: "Nunito_600SemiBold",
  bodyBold: "Nunito_700Bold",
  bodyHeavy: "Nunito_800ExtraBold",
};

const t = (s: TextStyle) => s;

/**
 * Die einzige Schriftskala der App (11 Größen). Fredoka 700 nur für `hero`
 * und `stat`. Im Code am besten über <T variant="…"> verwenden — die
 * Komponente setzt auch die Dynamic-Type-Grenzen.
 */
export const type = {
  hero: t({ fontFamily: fonts.displayBold, fontSize: 36, lineHeight: 42, letterSpacing: -0.3, color: colors.ink }),
  title: t({ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.2, color: colors.ink }),
  h1: t({ fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.ink }),
  h2: t({ fontFamily: fonts.display, fontSize: 21, lineHeight: 26, color: colors.ink }),
  h3: t({ fontFamily: fonts.display, fontSize: 17, lineHeight: 22, color: colors.ink }),
  stat: t({ fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 36, letterSpacing: -0.2, color: colors.ink }),
  button: t({ fontFamily: fonts.display, fontSize: 17, lineHeight: 22 }),
  buttonSm: t({ fontFamily: fonts.display, fontSize: 15, lineHeight: 20 }),
  bodyLong: t({ fontFamily: fonts.body, fontSize: 16, lineHeight: 25, color: colors.inkSoft }),
  body: t({ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkSoft }),
  bodyStrong: t({ fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 22, color: colors.ink }),
  chip: t({ fontFamily: fonts.bodyHeavy, fontSize: 14, lineHeight: 18, color: colors.ink }),
  small: t({ fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18, color: colors.inkSoft }),
  caption: t({ fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, color: colors.inkSoft }),
  label: t({
    fontFamily: fonts.bodyHeavy,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.muted,
  }),
};

export type TypeVariant = keyof typeof type;

/** Wie stark Dynamic Type eine Stilstufe vergrößern darf */
export const MAX_FONT_SCALE: Record<TypeVariant, number> = {
  hero: 1.25,
  title: 1.25,
  h1: 1.3,
  h2: 1.3,
  h3: 1.4,
  stat: 1.2,
  button: 1.3,
  buttonSm: 1.3,
  bodyLong: 1.6,
  body: 1.6,
  bodyStrong: 1.6,
  chip: 1.4,
  small: 1.5,
  caption: 1.4,
  label: 1.4,
};

/** Größe für Emoji-Sticker (Inhalt, nicht Bedienelemente) */
export const emoji = (size: 16 | 20 | 24 | 32 | 44 | 64 | 96): TextStyle => ({ fontSize: size, lineHeight: Math.round(size * 1.2) });

// ─── Raster ───────────────────────────────────────────────────────────────────

/** 4er-Raster. `gutter` = Seitenrand, `section` = Abstand zwischen Abschnitten */
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48, gutter: 20, section: 32 };

export const radius = { xs: 8, sm: 14, md: 20, lg: 28, xl: 36, pill: 999 };

/** Feste Größen für Bedienelemente */
export const size = {
  touch: 44,
  button: 56,
  buttonSm: 46,
  input: 52,
  chip: 40,
  pill: 28,
  icon: { sm: 18, md: 22, lg: 26 },
  tabBar: 68,
};

// ─── Schatten ─────────────────────────────────────────────────────────────────

const GLOW = "rgba(150,90,70,";
const insetLight = "inset 4px 4px 8px rgba(255,255,255,0.8)";
const insetDark = "inset -4px -4px 10px rgba(0,0,0,0.04)";

export const elevation = {
  flat: {} as ViewStyle,
  /** Karten, die auf dem Grund liegen */
  raised: { boxShadow: `0px 6px 16px ${GLOW}0.12), ${insetDark}, ${insetLight}` } as ViewStyle,
  /** Schwebende Elemente: Held, Tab-Leiste, Buchcover */
  float: { boxShadow: `0px 12px 28px ${GLOW}0.18), ${insetDark}, ${insetLight}` } as ViewStyle,
  /** Eingedrückt: Eingabefelder */
  pressed: { boxShadow: "inset 3px 4px 8px rgba(120,70,60,0.10), inset -3px -3px 6px rgba(255,255,255,0.8)" } as ViewStyle,
};

/** Der eine farbige Hauptknopf eines Screens */
export function ctaShadow(color: string): ViewStyle {
  return {
    boxShadow: [`0px 10px 20px ${tint(solid(color), 0.3)}`, "inset -4px -5px 10px rgba(0,0,0,0.14)", "inset 4px 4px 8px rgba(255,255,255,0.28)"].join(", "),
  } as ViewStyle;
}

// Kompatibilität: ältere Aufrufe von clay()/clayButton() landen auf den neuen Stufen.
/** @deprecated elevation.raised / elevation.float verwenden */
export function clay(_glow?: string, strength: "soft" | "normal" | "strong" = "normal"): ViewStyle {
  return strength === "strong" ? elevation.float : elevation.raised;
}
/** @deprecated ctaShadow verwenden */
export function clayButton(color: string): ViewStyle {
  return ctaShadow(color);
}

/** Weißraum unter der schwebenden Tab-Leiste (ohne Safe-Area; siehe useTabBarSpace) */
export const TAB_BAR_SPACE = size.tabBar + 14 + 32;
