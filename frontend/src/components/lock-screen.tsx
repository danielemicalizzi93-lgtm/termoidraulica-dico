import * as Haptics from "expo-haptics";
import { Backspace, LockKey } from "phosphor-react-native";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLock } from "@/src/local/lock-context";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export function LockScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { unlock } = useLock();
  const [entered, setEntered] = useState("");
  const [error, setError] = useState(false);

  const press = (k: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setError(false);
    if (k === "del") {
      setEntered((e) => e.slice(0, -1));
      return;
    }
    if (!k) return;
    const next = (entered + k).slice(0, 6);
    setEntered(next);
    // Auto-attempt once we have a plausible PIN length (4-6 digits).
    if (next.length >= 4 && unlock(next)) {
      setEntered("");
    }
  };

  const check = () => {
    if (!unlock(entered)) {
      setError(true);
      setEntered("");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing["3xl"], paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.top}>
        <View style={styles.lockIcon}>
          <LockKey color={colors.brandPrimary} size={30} weight="fill" />
        </View>
        <Text style={styles.title}>Inserisci il PIN</Text>
        <Text style={styles.sub}>App protetta — i dati restano sul dispositivo</Text>
        <View style={styles.dots}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < entered.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </View>
        {error ? <Text style={styles.errorText}>PIN errato, riprova</Text> : null}
      </View>

      <View style={styles.pad}>
        {KEYS.map((k, idx) => (
          <Pressable
            key={idx}
            testID={k ? `pin-key-${k}` : `pin-empty-${idx}`}
            disabled={!k}
            style={({ pressed }) => [styles.key, !k && styles.keyEmpty, pressed && k ? styles.keyPressed : null]}
            onPress={() => press(k)}
          >
            {k === "del" ? (
              <Backspace color={colors.onSurface} size={26} />
            ) : (
              <Text style={styles.keyText}>{k}</Text>
            )}
          </Pressable>
        ))}
      </View>

      <Pressable testID="pin-confirm" style={styles.confirm} onPress={check}>
        <Text style={styles.confirmText}>Sblocca</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl, alignItems: "center" },
  top: { alignItems: "center", gap: spacing.sm, flex: 1, justifyContent: "center" },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.onSurface },
  sub: { fontSize: 13, color: colors.muted, textAlign: "center" },
  dots: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.borderStrong },
  dotFilled: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  dotError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 13, marginTop: spacing.sm },
  pad: { flexDirection: "row", flexWrap: "wrap", width: 280, justifyContent: "space-between" },
  key: {
    width: 80,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: {},
  keyPressed: { opacity: 0.5 },
  keyText: { fontSize: 30, fontWeight: "600", color: colors.onSurface },
  confirm: {
    marginTop: spacing.lg,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
  },
  confirmText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: 16 },
}));
