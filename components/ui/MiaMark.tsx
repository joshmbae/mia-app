// ─── Mia-Wortmarke: weicher Clay-Blob mit Schriftzug ─────────────────────────

import React from "react";
import { Text, View } from "react-native";
import { colors, clayButton, fonts } from "../../utils/theme";

export function MiaMark({ size = 72 }: { size?: number }) {
  const r = (f: number) => Math.round(size * f);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          backgroundColor: colors.coral,
          alignItems: "center",
          justifyContent: "center",
          borderTopLeftRadius: r(0.46),
          borderTopRightRadius: r(0.54),
          borderBottomRightRadius: r(0.44),
          borderBottomLeftRadius: r(0.56),
        },
        clayButton(colors.coral),
      ]}
      accessibilityRole="image"
      accessibilityLabel="Mia"
    >
      <Text style={{ fontFamily: fonts.displayBold, fontSize: size * 0.36, color: colors.onAccent, marginTop: -size * 0.03 }}>
        mia
      </Text>
      <View
        style={{
          position: "absolute",
          right: -size * 0.06,
          top: -size * 0.04,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: size * 0.15,
          backgroundColor: colors.sun,
        }}
      />
    </View>
  );
}
