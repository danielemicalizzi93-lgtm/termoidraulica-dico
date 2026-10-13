import * as Haptics from "expo-haptics";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  testID,
  style,
}: ButtonProps) {
  const styles = useButtonStyles();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bg = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
    danger: styles.danger,
  }[variant];

  const txt = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    ghost: styles.ghostText,
    danger: styles.dangerText,
  }[variant];

  const handlePress = () => {
    if (isDisabled) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        bg,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "danger" ? colors.onBrandPrimary : colors.brandPrimary}
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, txt]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const useButtonStyles = makeStyles((colors) => ({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  text: { fontSize: 16, fontWeight: "700" },
  primary: { backgroundColor: colors.brandPrimary },
  primaryText: { color: colors.onBrandPrimary },
  secondary: { backgroundColor: colors.brandTertiary },
  secondaryText: { color: colors.onBrandTertiary },
  ghost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
  ghostText: { color: colors.onSurface },
  danger: { backgroundColor: colors.error },
  dangerText: { color: colors.onError },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
}));

// ---------------------------------------------------------------------------
// TextField
// ---------------------------------------------------------------------------
type FieldProps = TextInputProps & {
  label?: string;
  error?: string;
  testID?: string;
};

export function TextField({ label, error, testID, style, value, ...rest }: FieldProps) {
  const styles = useFieldStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        testID={testID}
        value={value ?? ""}
        placeholderTextColor={colors.muted}
        style={[styles.input, !!error && styles.inputError, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const useFieldStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.xs },
  label: { fontSize: 13, fontWeight: "600", color: colors.onSurfaceSecondary },
  input: {
    minHeight: 50,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.error },
  error: { fontSize: 12, color: colors.error },
}));

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  children,
  style,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const styles = useCardStyles();
  return (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const useCardStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));

// ---------------------------------------------------------------------------
// CheckRow (checkbox / radio style)
// ---------------------------------------------------------------------------
export function CheckRow({
  label,
  checked,
  onToggle,
  mode = "check",
  testID,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  mode?: "check" | "radio";
  testID?: string;
}) {
  const styles = useCheckStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        onToggle();
      }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View
        style={[
          styles.box,
          mode === "radio" && styles.radio,
          checked && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
        ]}
      >
        {checked ? <View style={mode === "radio" ? styles.dot : styles.tick} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const useCheckStyles = makeStyles((colors) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radio: { borderRadius: 12 },
  tick: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.onBrandPrimary,
    transform: [{ rotate: "-45deg" }],
    marginBottom: 2,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.onBrandPrimary },
  label: { flex: 1, fontSize: 15, color: colors.onSurface, lineHeight: 21 },
}));

// ---------------------------------------------------------------------------
// SectionLabel
// ---------------------------------------------------------------------------
export function SectionLabel({ children }: { children: ReactNode }) {
  const styles = useSectionStyles();
  return <Text style={styles.label}>{children}</Text>;
}

const useSectionStyles = makeStyles((colors) => ({
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
}));
