// ─── Formular-Bausteine: Feld, Datumswahl, Auswahl-Chips, Farbwahl ───────────

import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { colors, clay, fonts, radius, tint } from "../../utils/theme";
import { formatDate, parseISODate, toISODate, todayISO } from "../../utils/dates";
import { Squish } from "./Clay";

export function FieldLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <View style={styles.labelWrap}>
      <Text style={styles.label}>{children}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Field({
  label,
  hint,
  multiline,
  style,
  ...input
}: TextInputProps & { label?: string; hint?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      {label ? <FieldLabel hint={hint}>{label}</FieldLabel> : null}
      <TextInput
        {...input}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        onFocus={(e) => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          focused && styles.inputFocused,
          clay(colors.coral, "soft"),
          style,
        ]}
        textAlignVertical={multiline ? "top" : "center"}
        accessibilityLabel={label ?? input.placeholder}
      />
    </View>
  );
}

/** Auswahl aus wenigen Optionen als Chips */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  color = colors.coral,
}: {
  options: { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap }[];
  value: T | undefined;
  onChange: (v: T) => void;
  color?: string;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Squish
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.chip, active ? { backgroundColor: color } : styles.chipIdle]}
          >
            {o.icon && <Ionicons name={o.icon} size={15} color={active ? colors.onAccent : colors.inkSoft} />}
            <Text style={[styles.chipText, active && { color: colors.onAccent }]}>{o.label}</Text>
          </Squish>
        );
      })}
    </View>
  );
}

/** Farbwahl für ein Kind */
export function ColorPicker({ options, value, onChange }: { options: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <View style={styles.colors}>
      {options.map((c) => (
        <Squish
          key={c}
          onPress={() => onChange(c)}
          accessibilityRole="button"
          accessibilityLabel={`Farbe ${c}`}
          accessibilityState={{ selected: c === value }}
          style={[styles.swatch, { backgroundColor: c }, c === value && { borderColor: colors.ink }]}
        >
          {c === value ? <Ionicons name="checkmark" size={20} color={colors.onAccent} /> : null}
        </Squish>
      ))}
    </View>
  );
}

/**
 * Datumswahl: Schnellwahl "Heute"/"Gestern" plus Kalender. Im Web ein
 * natives Datumsfeld des Browsers.
 */
export function DateField({
  value,
  onChange,
  color = colors.coral,
  quick = true,
  maximumDate,
  minimumDate,
}: {
  value: string;
  onChange: (iso: string) => void;
  color?: string;
  quick?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const today = todayISO();
  const yesterday = toISODate(new Date(Date.now() - 86400000));
  const custom = !quick || (value !== today && value !== yesterday);

  if (Platform.OS === "web") {
    return (
      <View style={styles.chips}>
        {quick && <DateChip label="Heute" active={value === today} color={color} onPress={() => onChange(today)} />}
        {quick && <DateChip label="Gestern" active={value === yesterday} color={color} onPress={() => onChange(yesterday)} />}
        <View style={[styles.chip, styles.chipIdle, { paddingVertical: 0 }]}>
          <Ionicons name="calendar-outline" size={15} color={colors.inkSoft} />
          {React.createElement("input", {
            type: "date",
            value,
            max: maximumDate ? toISODate(maximumDate) : undefined,
            min: minimumDate ? toISODate(minimumDate) : undefined,
            onChange: (e: { target: { value: string } }) => e.target.value && onChange(e.target.value),
            "aria-label": "Datum wählen",
            style: {
              border: "none",
              background: "transparent",
              fontFamily: "Nunito_700Bold, sans-serif",
              fontSize: 14,
              color: colors.ink,
              height: 40,
              outline: "none",
            },
          })}
        </View>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.chips}>
        {quick && <DateChip label="Heute" active={value === today} color={color} onPress={() => onChange(today)} />}
        {quick && <DateChip label="Gestern" active={value === yesterday} color={color} onPress={() => onChange(yesterday)} />}
        <DateChip
          label={custom ? formatDate(value) : "Anderes Datum"}
          icon="calendar-outline"
          active={custom}
          color={color}
          onPress={() => setOpen((v) => !v)}
        />
      </View>
      {open && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={parseISODate(value)}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            accentColor={color}
            locale="de-DE"
            onChange={(event, d) => {
              if (Platform.OS !== "ios") setOpen(false);
              if (d && event.type !== "dismissed") onChange(toISODate(d));
            }}
          />
          {Platform.OS === "ios" && (
            <Squish onPress={() => setOpen(false)} style={styles.done} accessibilityRole="button">
              <Text style={[styles.doneText, { color }]}>Fertig</Text>
            </Squish>
          )}
        </View>
      )}
    </View>
  );
}

function DateChip({
  label,
  active,
  color,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Squish
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active ? { backgroundColor: color } : styles.chipIdle]}
    >
      {icon && <Ionicons name={icon} size={15} color={active ? colors.onAccent : colors.inkSoft} />}
      <Text style={[styles.chipText, active && { color: colors.onAccent }]}>{label}</Text>
    </Squish>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 18, alignSelf: "stretch" },
  labelWrap: { marginBottom: 8, paddingHorizontal: 4 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 12, letterSpacing: 0.9, textTransform: "uppercase", color: colors.muted },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 3, lineHeight: 18 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputMultiline: { minHeight: 120, lineHeight: 22 },
  inputFocused: { borderColor: tint(colors.coral, 0.5) },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  chipIdle: { backgroundColor: colors.surface },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.ink },
  colors: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  pickerWrap: { marginTop: 10, backgroundColor: colors.surface, borderRadius: radius.md, padding: 6 },
  done: { alignSelf: "flex-end", paddingHorizontal: 12, paddingVertical: 8 },
  doneText: { fontFamily: fonts.bodyHeavy, fontSize: 15 },
});
