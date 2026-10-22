import { useRef, useState } from "react";
import { Modal, PanResponder, Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Button, TextField } from "@/src/components/ui";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export type SignatureT = { paths: string[]; w: number; h: number; name?: string; date?: string };

// Full-screen modal to draw a signature with the finger.
export function SignatureModal({
  visible,
  title,
  nameLabel,
  initialName,
  onSave,
  onClose,
}: {
  visible: boolean;
  title: string;
  nameLabel?: string;
  initialName?: string;
  onSave: (s: SignatureT) => void;
  onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [paths, setPaths] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [size, setSize] = useState({ w: 320, h: 200 });
  const [name, setName] = useState(initialName ?? "");
  const cur = useRef("");

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        cur.current = `M${x.toFixed(1)} ${y.toFixed(1)}`;
        setCurrent(cur.current);
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        cur.current += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
        setCurrent(cur.current);
      },
      onPanResponderRelease: () => {
        const p = cur.current;
        if (p) setPaths((ps) => [...ps, p.includes("L") ? p : `${p} l0.1 0.1`]);
        cur.current = "";
        setCurrent("");
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: Math.round(width), h: Math.round(height) });
  };

  const reset = () => {
    setPaths([]);
    setCurrent("");
  };

  const save = () => {
    onSave({ paths, w: size.w, h: size.h, name: nameLabel ? name.trim() : undefined, date: new Date().toISOString() });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onShow={() => setName(initialName ?? "")}>
      <View style={[styles.root, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          <Pressable testID="signature-cancel" onPress={onClose} hitSlop={10}>
            <Text style={styles.cancel}>Annulla</Text>
          </Pressable>
        </View>
        {nameLabel ? (
          <TextField label={nameLabel} value={name} onChangeText={setName} testID="signature-name" />
        ) : null}
        <Text style={styles.hint}>Firma con il dito nel riquadro</Text>
        <View style={styles.pad} onLayout={onLayout} testID="signature-pad" {...responder.panHandlers}>
          <Svg width="100%" height="100%" pointerEvents="none">
            {[...paths, current].filter(Boolean).map((d, i) => (
              <Path key={i} d={d} stroke={colors.onSurface} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </Svg>
          <View style={styles.baseline} pointerEvents="none" />
        </View>
        <View style={styles.actions}>
          <Button testID="signature-clear" title="Cancella" variant="secondary" onPress={reset} style={{ flex: 1 }} />
          <Button
            testID="signature-save"
            title="Salva firma"
            onPress={save}
            disabled={paths.length === 0 || (!!nameLabel && !name.trim())}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Modal>
  );
}

// Static preview of a saved signature.
export function SignaturePreview({ sig, height = 70 }: { sig: SignatureT; height?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${sig.w} ${sig.h}`} preserveAspectRatio="xMidYMid meet">
      {sig.paths.map((d, i) => (
        <Path key={i} d={d} stroke={colors.onSurface} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, gap: spacing.md },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 18, fontWeight: "800", color: colors.onSurface, flex: 1 },
  cancel: { color: colors.brandPrimary, fontWeight: "700", fontSize: 15 },
  hint: { fontSize: 13, color: colors.muted },
  pad: {
    flex: 1,
    maxHeight: 320,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: "hidden",
  },
  baseline: { position: "absolute", left: 24, right: 24, bottom: 48, height: 1, backgroundColor: colors.border },
  actions: { flexDirection: "row", gap: spacing.sm },
}));
