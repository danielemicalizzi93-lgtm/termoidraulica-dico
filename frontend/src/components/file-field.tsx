import { Image } from "expo-image";
import { FilePdf, Paperclip, Trash } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { isPdf, pickFile, removeImage, type FileT } from "@/src/local/attachments";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

// One-tap picker for a single document (image or PDF).
export function FileField({
  label,
  hint,
  value,
  onChange,
  required,
  testID,
}: {
  label: string;
  hint?: string;
  value?: FileT | null;
  onChange: (f: FileT | null) => void;
  required?: boolean;
  testID: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    setBusy(true);
    try {
      const f = await pickFile();
      if (f) {
        if (value) await removeImage(value.uri);
        onChange(f);
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (value) await removeImage(value.uri);
    onChange(null);
  };

  const missing = required && !value;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.req}> *</Text> : null}
        </Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {value ? (
        <View style={styles.file} testID={`${testID}-file`}>
          {isPdf(value) ? (
            <FilePdf color={colors.error} size={28} weight="fill" />
          ) : (
            <Image source={{ uri: value.uri }} style={styles.thumb} contentFit="cover" />
          )}
          <Text style={styles.name} numberOfLines={1}>
            {value.name}
          </Text>
          <Pressable testID={`${testID}-change`} onPress={pick} hitSlop={8} style={styles.iconBtn}>
            <Text style={styles.link}>Cambia</Text>
          </Pressable>
          <Pressable testID={`${testID}-remove`} onPress={remove} hitSlop={8} style={styles.iconBtn}>
            <Trash color={colors.error} size={18} weight="bold" />
          </Pressable>
        </View>
      ) : (
        <Pressable testID={testID} style={[styles.empty, missing && styles.emptyRequired]} onPress={pick}>
          {busy ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : (
            <>
              <Paperclip color={missing ? colors.error : colors.brandPrimary} size={20} weight="bold" />
              <Text style={[styles.emptyText, missing && { color: colors.error }]}>Allega PDF o foto</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.xs },
  head: { gap: 2 },
  label: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  req: { color: colors.error },
  hint: { fontSize: 12, color: colors.muted },
  file: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  thumb: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  name: { flex: 1, fontSize: 14, color: colors.onSurface, fontWeight: "600" },
  iconBtn: { minHeight: 40, paddingHorizontal: spacing.xs, alignItems: "center", justifyContent: "center" },
  link: { color: colors.brandPrimary, fontWeight: "700", fontSize: 14 },
  empty: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandTertiary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyRequired: { borderColor: colors.error, backgroundColor: colors.surfaceTertiary },
  emptyText: { color: colors.brandPrimary, fontWeight: "700", fontSize: 14 },
}));
