import { CaretLeft, X } from "phosphor-react-native";
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export function WizardShell({
  title,
  step,
  total,
  onClose,
  onBack,
  onNext,
  nextLabel,
  nextLoading,
  children,
}: {
  title: string;
  step: number;
  total: number;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextLoading?: boolean;
  children: ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const progress = ((step + 1) / total) * 100;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          {step > 0 ? (
            <Pressable testID="wizard-back" onPress={onBack} style={styles.iconBtn}>
              <CaretLeft color={colors.onSurface} size={22} weight="bold" />
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.stepText}>
              Passo {step + 1} di {total}
            </Text>
          </View>
          <Pressable testID="wizard-close" onPress={onClose} style={styles.iconBtn}>
            <X color={colors.onSurface} size={22} weight="bold" />
          </Pressable>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120, gap: spacing.md }}
        bottomOffset={100}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </KeyboardAwareScrollView>

      <KeyboardStickyView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button testID="wizard-next" title={nextLabel} onPress={onNext} loading={nextLoading} />
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  titleWrap: { flex: 1, alignItems: "center" },
  title: { fontSize: 17, fontWeight: "800", color: colors.onSurface },
  stepText: { fontSize: 12, color: colors.muted },
  progressTrack: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  progressFill: { height: 5, borderRadius: radius.pill, backgroundColor: colors.brandPrimary },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
