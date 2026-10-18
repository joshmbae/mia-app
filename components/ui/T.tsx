// ─── Text mit fester Stilstufe ───────────────────────────────────────────────
// <T variant="h2">Titel</T> statt <Text style={{ fontSize: … }}>. Setzt auch
// die Dynamic-Type-Grenze, damit große Systemschrift das Layout nicht sprengt.

import React from "react";
import { Text, TextProps } from "react-native";
import { MAX_FONT_SCALE, type, TypeVariant } from "../../utils/theme";

export function T({
  variant = "body",
  color,
  align,
  style,
  ...rest
}: TextProps & { variant?: TypeVariant; color?: string; align?: "left" | "center" | "right" }) {
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE[variant]}
      {...rest}
      style={[type[variant], color ? { color } : null, align ? { textAlign: align } : null, style]}
    />
  );
}
