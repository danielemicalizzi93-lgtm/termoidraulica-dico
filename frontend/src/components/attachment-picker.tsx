import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImageSquare, X } from "phosphor-react-native";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import type { AttachmentT } from "@/src/local/db";
import { uid } from "@/src/local/db";
import { persistImage, removeImage } from "@/src/local/attachments";
import { Button } from "@/src/components/ui";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export function AttachmentPicker({
  value,
  onChange,
}: {
  value: AttachmentT[];
  onChange: (v: AttachmentT[]) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [blocked, setBlocked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const addAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    const next: AttachmentT[] = [];
    for (const a of assets) {
      const persisted = await persistImage(a.uri);
      next.push({ id: uid(), uri: persisted, name: a.fileName || "allegato" });
    }
    onChange([...value, ...next]);
  };

  const fromCamera = async () => {
    setBlocked(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setBlocked(
        perm.canAskAgain
          ? "Permesso fotocamera necessario per scattare foto."
          : "Abilita la fotocamera dalle impostazioni per scattare foto.",
      );
      return;
    }
    setBusy(true);
    try {
      const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      if (!res.canceled) await addAssets(res.assets);
    } finally {
      setBusy(false);
    }
  };

  const fromLibrary = async () => {
    setBlocked(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted && !perm.canAskAgain) {
      setBlocked("Abilita l'accesso alle foto dalle impostazioni.");
      return;
    }
    setBusy(true);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.6,
      });
      if (!res.canceled) await addAssets(res.assets);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (att: AttachmentT) => {
    await removeImage(att.uri);
    onChange(value.filter((a) => a.id !== att.id));
  };

  return (
    <View style={styles.wrap}>
      {value.length > 0 ? (
        <View style={styles.grid}>
          {value.map((a) => (
            <View key={a.id} style={styles.thumbWrap}>
              <Image source={{ uri: a.uri }} style={styles.thumb} contentFit="cover" />
              <Pressable
                testID={`remove-attachment-${a.id}`}
                style={styles.removeBtn}
                onPress={() => remove(a)}
                hitSlop={8}
              >
                <X color={colors.onError} size={14} weight="bold" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          testID="attach-camera"
          title="Fotocamera"
          variant="secondary"
          onPress={fromCamera}
          loading={busy}
          icon={<Camera color={colors.onBrandTertiary} size={20} weight="fill" />}
          style={styles.action}
        />
        <Button
          testID="attach-library"
          title="Galleria"
          variant="secondary"
          onPress={fromLibrary}
          loading={busy}
          icon={<ImageSquare color={colors.onBrandTertiary} size={20} weight="fill" />}
          style={styles.action}
        />
      </View>

      {blocked ? (
        <View style={styles.blocked}>
          <Text style={styles.blockedText}>{blocked}</Text>
          <Pressable testID="open-settings" onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsLink}>Apri impostazioni</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumbWrap: { width: 84, height: 84 },
  thumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", gap: spacing.sm },
  action: { flex: 1 },
  blocked: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  blockedText: { color: colors.onSurfaceTertiary, fontSize: 13 },
  settingsLink: { color: colors.brandPrimary, fontWeight: "700", fontSize: 14 },
}));
