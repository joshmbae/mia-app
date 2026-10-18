// ─── Mia Design-Tokens ───────────────────────────────────────────────────────
// Verspielt, aber ruhig: warmes Creme als Grund, klare weiße Karten, wenige
// kräftige Akzentfarben. Neue Screens nutzen diese Tokens statt Hex-Werten.

export const colors = {
  bg: "#FFF8F0",
  surface: "#FFFFFF",
  surfaceMuted: "#F6EFE6",
  line: "#EFE5D8",
  ink: "#2E2A35",
  inkSoft: "#5F5868",
  muted: "#9A92A3",
  primary: "#3F8573",
  primarySoft: "#E3F2EC",
  sun: "#FFC857",
  sunSoft: "#FFF3D6",
  coral: "#F07B6E",
  coralSoft: "#FDE8E4",
  lilac: "#8C6CD9",
  lilacSoft: "#EFE9FB",
  sky: "#4F94D4",
  skySoft: "#E5F0FA",
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const shadow = {
  shadowColor: "#2E2A35",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.07,
  shadowRadius: 12,
  elevation: 3,
};

export const shadowSoft = {
  shadowColor: "#2E2A35",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 1,
};

/** Hex-Farbe mit Alpha (0–1) */
export function tint(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return hex + a;
}
