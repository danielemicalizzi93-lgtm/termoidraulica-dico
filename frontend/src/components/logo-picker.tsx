import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { ImageSquare, Trash } from "phosphor-react-native";
import { Pressable, Text, View } from "react-native";

import { persistImage, removeImage } from "@/src/local/attachments";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

// One-tap company logo picker. The logo is printed on every document.
export function LogoPicker({ value, onChange }: { value?: string; onChange: (uri: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  // System photo picker: no gallery permission needed.
  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (res.canceled || !res.assets?.length) return;
    const uri = await persistImage(res.assets[0].uri);
    if (value) await removeImage(value);
    onChange(uri);
  };

  const remove = async () => {
    if (value) await removeImage(value);
    onChange("");
  };

  return (
    <View style={styles.wrap}>
      <Pressable testID="company-logo-pick" style={styles.box} onPress={pick}>
        {value ? (
          <Image testID="company-logo-image" source={{ uri: value }} style={styles.img} contentFit="contain" />
        ) : (
          <View style={styles.empty}>
            <ImageSquare color={colors.brandPrimary} size={28} weight="duotone" />
            <Text style={styles.emptyText}>Tocca per inserire il logo</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.side}>
        <Text style={styles.hint}>Il logo comparirà nell&apos;intestazione di tutte le DiCo e DiRi esportate.</Text>
        {value ? (
          <View style={styles.actions}>
            <Pressable testID="company-logo-change" onPress={pick} hitSlop={6}>
              <Text style={styles.link}>Cambia</Text>
            </Pressable>
            <Pressable testID="company-logo-remove" onPress={remove} hitSlop={6} style={styles.removeRow}>
              <Trash color={colors.error} size={14} weight="bold" />
              <Text style={styles.removeText}>Rimuovi</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  box: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.brandPrimary,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  img: { width: "100%", height: "100%" },
  empty: { alignItems: "center", gap: 4, padding: spacing.xs },
  emptyText: { fontSize: 11, color: colors.brandPrimary, fontWeight: "600", textAlign: "center" },
  side: { flex: 1, gap: spacing.sm },
  hint: { fontSize: 13, color: colors.muted },
  actions: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  link: { color: colors.brandPrimary, fontWeight: "700", fontSize: 14 },
  removeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  removeText: { color: colors.error, fontWeight: "700", fontSize: 14 },
}));
