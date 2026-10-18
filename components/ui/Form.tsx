// ─── Formular-Bausteine: Feld, Datumswahl, Auswahl-Chips, Farbwahl ───────────

import React, { useId, useState } from "react";
import { InputAccessoryView, Keyboard, Platform, StyleSheet, TextInput, TextInputProps, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { COLOR_NAMES, colors, elevation, fonts, MAX_FONT_SCALE, radius, size, solid, space, type } from "../../utils/theme";
import { formatDate, parseISODate, toISODate, todayISO } from "../../utils/dates";
import { Squish } from "./Clay";
import { T } from "./T";

export function FieldLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <View style={styles.labelWrap}>
      <T variant="label">{children}</T>
      {hint ? (
        <T variant="small" style={{ marginTop: space.xxs }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

/**
 * Eingabefeld: eingedrückt statt erhaben, optional mit Einheit ("cm") im Feld.
 * Bei Zahlentastaturen gibt es auf iOS eine "Fertig"-Leiste.
 */
export function Field({
  label,
  hint,
  unit,
  multiline,
  style,
  ...input
}: TextInputProps & { label?: string; hint?: string; unit?: string }) {
  const [focused, setFocused] = useState(false);
  const accessoryId = useId();
  const numeric = input.keyboardType === "decimal-pad" || input.keyboardType === "number-pad";
  const withAccessory = numeric && Platform.OS === "ios";
  return (
    <View style={styles.field}>
      {label ? <FieldLabel hint={hint}>{label}</FieldLabel> : null}
      <View style={[styles.inputWrap, multiline && styles.inputWrapMultiline, focused && styles.inputFocused, elevation.pressed]}>
        <TextInput
          {...input}
          multiline={multiline}
          placeholderTextColor={colors.faint}
          maxFontSizeMultiplier={MAX_FONT_SCALE.body}
          inputAccessoryViewID={withAccessory ? accessoryId : input.inputAccessoryViewID}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          textAlignVertical={multiline ? "top" : "center"}
          accessibilityLabel={input.accessibilityLabel ?? (unit ? `${label ?? ""} in ${unit}` : label ?? input.placeholder)}
        />
        {unit ? (
          <T variant="bodyStrong" color={colors.muted} style={styles.unit}>
            {unit}
          </T>
        ) : null}
      </View>
      {withAccessory && (
        <InputAccessoryView nativeID={accessoryId}>
          <View style={styles.accessory}>
            <Squish onPress={() => Keyboard.dismiss()} accessibilityRole="button" accessibilityLabel="Tastatur schließen" style={styles.accessoryBtn}>
              <T variant="chip" color={colors.coralDeep}>
                Fertig
              </T>
            </Squish>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
}

/** Auswahl aus wenigen Optionen (Radio-Gruppe) als Chips */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  color = colors.coral,
  label,
}: {
  options: { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap }[];
  value: T | undefined;
  onChange: (v: T) => void;
  color?: string;
  label?: string;
}) {
  const fill = solid(color);
  return (
    <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Squish
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={o.label}
            style={[styles.chip, active ? { backgroundColor: fill, borderColor: fill } : null]}
          >
            {o.icon && <Ionicons name={o.icon} size={size.icon.sm - 2} color={active ? colors.onAccent : colors.inkSoft} />}
            <T variant="chip" color={active ? colors.onAccent : colors.ink}>
              {o.label}
            </T>
          </Squish>
        );
      })}
    </View>
  );
}

/** Farbwahl für ein Kind */
export function ColorPicker({ options, value, onChange }: { options: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <View style={styles.colors} accessibilityRole="radiogroup" accessibilityLabel="Farbe">
      {options.map((c) => (
        <Squish
          key={c}
          onPress={() => onChange(c)}
          accessibilityRole="radio"
          accessibilityLabel={COLOR_NAMES[c] ?? "Farbe"}
          accessibilityState={{ checked: c === value }}
          style={[styles.swatch, { backgroundColor: c }, c === value && styles.swatchActive]}
        >
          {c === value ? <Ionicons name="checkmark" size={size.icon.md} color={colors.onAccent} /> : null}
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
        <View style={styles.chip}>
          <Ionicons name="calendar-outline" size={size.icon.sm - 2} color={colors.inkSoft} />
          {React.createElement("input", {
            type: "date",
            lang: "de-DE",
            value,
            max: maximumDate ? toISODate(maximumDate) : undefined,
            min: minimumDate ? toISODate(minimumDate) : undefined,
            onChange: (e: { target: { value: string } }) => e.target.value && onChange(e.target.value),
            "aria-label": "Datum wählen",
            style: {
              border: "none",
              background: "transparent",
              fontFamily: fonts.bodyHeavy,
              fontSize: 14,
              color: colors.ink,
              height: 36,
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
        <View style={[styles.pickerWrap, elevation.raised]}>
          <DateTimePicker
            value={parseISODate(value)}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            accentColor={solid(color)}
            locale="de-DE"
            onChange={(event, d) => {
              if (Platform.OS !== "ios") setOpen(false);
              if (d && event.type !== "dismissed") onChange(toISODate(d));
            }}
          />
          {Platform.OS === "ios" && (
            <Squish onPress={() => setOpen(false)} style={styles.done} accessibilityRole="button">
              <T variant="chip" color={solid(color)}>
                Fertig
              </T>
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
  const fill = solid(color);
  return (
    <Squish
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      style={[styles.chip, active ? { backgroundColor: fill, borderColor: fill } : null]}
    >
      {icon && <Ionicons name={icon} size={size.icon.sm - 2} color={active ? colors.onAccent : colors.inkSoft} />}
      <T variant="chip" color={active ? colors.onAccent : colors.ink}>
        {label}
      </T>
    </Squish>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: space.md + 4, alignSelf: "stretch" },
  labelWrap: { marginBottom: space.xs, paddingHorizontal: space.xxs },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: size.input,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    paddingRight: space.md,
  },
  inputWrapMultiline: { alignItems: "flex-start" },
  inputFocused: { borderColor: colors.peach, backgroundColor: colors.surface },
  input: {
    flex: 1,
    minHeight: size.input - 4,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    ...type.bodyStrong,
    fontSize: 16,
    color: colors.ink,
  },
  inputMultiline: { minHeight: 120, paddingTop: space.sm + 2 },
  unit: { marginLeft: space.xs },
  accessory: { flexDirection: "row", justifyContent: "flex-end", backgroundColor: colors.surfaceSoft, borderTopWidth: 1, borderTopColor: colors.line },
  accessoryBtn: { paddingHorizontal: space.md + 4, paddingVertical: space.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xxs + 2,
    minHeight: size.chip + 4,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.line,
  },
  colors: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  swatch: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },
  swatchActive: { borderColor: colors.ink },
  pickerWrap: { marginTop: space.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: space.xs },
  done: { alignSelf: "flex-end", paddingHorizontal: space.sm, paddingVertical: space.xs, minHeight: size.touch, justifyContent: "center" },
});
