import { useRouter } from "expo-router";
import {
  ArrowClockwise,
  Check,
  GridFour,
  Minus,
  PencilLine,
  Plus,
  TextT,
  Trash,
  X,
} from "phosphor-react-native";
import { useRef, useState } from "react";
import { Animated, PanResponder, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Svg, { Circle, Line, Polyline, Rect, SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { uid } from "@/src/local/db";
import { TextField } from "@/src/components/ui";
import { SCHEMA_COLORS, schemaDraft } from "@/src/schema/draft";
import {
  emptySchema,
  resolveLine,
  symbolPortWorld,
  type SchemaElement,
  type SchemaT,
  type SymbolEl,
} from "@/src/schema/render";
import { PORT_KEYS, SYMBOL_PALETTE, symbolSvg } from "@/src/schema/symbols";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

const DEFAULT_SIZE = 48;
const GRID = 20;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function snapTo(v: number, enabled: boolean) {
  return enabled ? Math.round(v / GRID) * GRID : v;
}

type LabelEl = Extract<SchemaElement, { kind: "label" }>;

function DraggableLabel({
  el,
  selected,
  draggable,
  canvas,
  grid,
  onSelect,
  onMove,
}: {
  el: LabelEl;
  selected: boolean;
  draggable: boolean;
  canvas: { w: number; h: number };
  grid: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const { colors } = useTheme();
  const pan = useRef(new Animated.ValueXY({ x: el.x, y: el.y })).current;
  const posRef = useRef({ x: el.x, y: el.y });
  const startRef = useRef({ x: el.x, y: el.y });

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => draggable,
      onMoveShouldSetPanResponder: () => draggable,
      onPanResponderGrant: () => {
        onSelect();
        startRef.current = { ...posRef.current };
      },
      onPanResponderMove: (_e, g) => {
        const x = clamp(startRef.current.x + g.dx, 0, canvas.w - 20);
        const y = clamp(startRef.current.y + g.dy, 0, canvas.h - 20);
        posRef.current = { x, y };
        pan.setValue({ x, y });
      },
      onPanResponderRelease: () => {
        const x = snapTo(posRef.current.x, grid);
        const y = snapTo(posRef.current.y, grid);
        pan.setValue({ x, y });
        onMove(x, y);
      },
    }),
  ).current;

  const content = (
    <Text style={{ color: el.color, fontSize: el.size, fontWeight: "700" }} numberOfLines={1}>
      {el.text || "Testo"}
    </Text>
  );

  const box = {
    position: "absolute" as const,
    paddingHorizontal: 2,
    borderWidth: selected ? 1 : 0,
    borderColor: colors.brandPrimary,
    borderStyle: "dashed" as const,
    borderRadius: 4,
  };

  if (Platform.OS === "web") {
    return (
      <Pressable onPress={onSelect} style={[box, { left: el.x, top: el.y }]}>
        {content}
      </Pressable>
    );
  }

  return (
    <Animated.View {...responder.panHandlers} style={[box, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}>
      {content}
    </Animated.View>
  );
}

function DraggableSymbol({
  el,
  selected,
  draggable,
  canvas,
  grid,
  onSelect,
  onMove,
}: {
  el: Extract<SchemaElement, { kind: "symbol" }>;
  selected: boolean;
  draggable: boolean;
  canvas: { w: number; h: number };
  grid: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const { colors } = useTheme();
  const pan = useRef(new Animated.ValueXY({ x: el.x, y: el.y })).current;
  const posRef = useRef({ x: el.x, y: el.y });
  const startRef = useRef({ x: el.x, y: el.y });

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => draggable,
      onMoveShouldSetPanResponder: () => draggable,
      onPanResponderGrant: () => {
        onSelect();
        startRef.current = { ...posRef.current };
      },
      onPanResponderMove: (_e, g) => {
        const x = clamp(startRef.current.x + g.dx, 0, canvas.w - el.size);
        const y = clamp(startRef.current.y + g.dy, 0, canvas.h - el.size);
        posRef.current = { x, y };
        pan.setValue({ x, y });
      },
      onPanResponderRelease: () => {
        const x = snapTo(posRef.current.x, grid);
        const y = snapTo(posRef.current.y, grid);
        posRef.current = { x, y };
        pan.setValue({ x, y });
        onMove(x, y);
      },
    }),
  ).current;

  // Web: no responder/drag (avoids RNW DOM warnings); tap to select only.
  if (Platform.OS === "web") {
    return (
      <Pressable
        onPress={onSelect}
        style={{
          position: "absolute",
          left: el.x,
          top: el.y,
          width: el.size,
          height: el.size,
          transform: [{ rotate: `${el.rotation || 0}deg` }],
          borderWidth: selected ? 2 : 0,
          borderColor: colors.brandPrimary,
          borderRadius: 6,
          borderStyle: "dashed",
        }}
      >
        <SvgXml xml={symbolSvg(el.symbol, el.color, el.size)} width={el.size} height={el.size} />
      </Pressable>
    );
  }

  return (
    <Animated.View
      {...responder.panHandlers}
      style={{
        position: "absolute",
        width: el.size,
        height: el.size,
        transform: [
          { translateX: pan.x },
          { translateY: pan.y },
          { rotate: `${el.rotation || 0}deg` },
        ],
        borderWidth: selected ? 2 : 0,
        borderColor: colors.brandPrimary,
        borderRadius: 6,
        borderStyle: "dashed",
      }}
    >
      <SvgXml xml={symbolSvg(el.symbol, el.color, el.size)} width={el.size} height={el.size} />
    </Animated.View>
  );
}

export default function SchemaEditor() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [schema, setSchema] = useState<SchemaT>(() => schemaDraft.get() || emptySchema());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineMode, setLineMode] = useState(false);
  const [draftPts, setDraftPts] = useState<{ x: number; y: number; ref?: { sym: string; port: string } }[]>([]);
  const [color, setColor] = useState(SCHEMA_COLORS[0]);
  const [lineW] = useState(5);
  const [grid, setGrid] = useState(true);
  const canvasRef = useRef(schema.canvas);

  const selected = schema.elements.find((e) => e.id === selectedId) || null;

  const mutate = (fn: (els: SchemaElement[]) => SchemaElement[]) =>
    setSchema((s) => ({ ...s, elements: fn(s.elements) }));

  const onCanvasLayout = (w: number, h: number) => {
    canvasRef.current = { w, h };
    setSchema((s) => ({ ...s, canvas: { w, h } }));
  };

  const addSymbol = (key: string) => {
    const { w, h } = canvasRef.current;
    const offset = schema.elements.length * 6;
    const el: SchemaElement = {
      id: uid(),
      kind: "symbol",
      symbol: key,
      x: snapTo(clamp(w / 2 - DEFAULT_SIZE / 2 + offset, 0, w - DEFAULT_SIZE), grid),
      y: snapTo(clamp(h / 2 - DEFAULT_SIZE / 2 + offset, 0, h - DEFAULT_SIZE), grid),
      size: DEFAULT_SIZE,
      color,
      rotation: 0,
    };
    mutate((els) => [...els, el]);
    setSelectedId(el.id);
  };

  const addLabel = () => {
    const { w, h } = canvasRef.current;
    const el: SchemaElement = {
      id: uid(),
      kind: "label",
      x: snapTo(w / 2 - 40, grid),
      y: snapTo(h / 2, grid),
      text: "Testo",
      color: "#1C1C1A",
      size: 18,
    };
    mutate((els) => [...els, el]);
    setSelectedId(el.id);
  };

  const onCanvasTap = (x: number, y: number) => {
    if (lineMode) {
      const snap = findSnap(x, y);
      setDraftPts((p) => [...p, snap ?? { x: snapTo(x, grid), y: snapTo(y, grid) }]);
    } else {
      setSelectedId(null);
    }
  };

  // Find the nearest symbol port within snap distance.
  const findSnap = (x: number, y: number) => {
    const THRESHOLD = 28;
    let best: { x: number; y: number; ref: { sym: string; port: string } } | null = null;
    let bestD = THRESHOLD;
    for (const el of schema.elements) {
      if (el.kind !== "symbol") continue;
      for (const port of PORT_KEYS) {
        const w = symbolPortWorld(el as SymbolEl, port);
        const d = Math.hypot(w.x - x, w.y - y);
        if (d < bestD) {
          bestD = d;
          best = { x: w.x, y: w.y, ref: { sym: el.id, port } };
        }
      }
    }
    return best;
  };

  const commitLine = () => {
    if (draftPts.length >= 2) {
      const points = draftPts.map((p) => (p.ref ? { sym: p.ref.sym, port: p.ref.port } : { x: p.x, y: p.y }));
      const el: SchemaElement = { id: uid(), kind: "line", points, color, width: lineW };
      mutate((els) => [...els, el]);
    }
    setDraftPts([]);
    setLineMode(false);
  };

  const updateSelected = (patch: Partial<SchemaElement>) => {
    if (!selectedId) return;
    mutate((els) => els.map((e) => (e.id === selectedId ? ({ ...e, ...patch } as SchemaElement) : e)));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    mutate((els) => els.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  };

  const save = () => {
    schemaDraft.set(schema);
    router.back();
  };

  const lines = schema.elements.filter((e) => e.kind === "line") as Extract<SchemaElement, { kind: "line" }>[];
  const symbols = schema.elements.filter((e) => e.kind === "symbol") as Extract<SchemaElement, { kind: "symbol" }>[];
  const labels = schema.elements.filter((e) => e.kind === "label") as LabelEl[];

  const gridLines: React.ReactNode[] = [];
  if (grid) {
    const { w, h } = canvasRef.current;
    for (let gx = GRID; gx < w; gx += GRID) {
      gridLines.push(<Line key={`gx${gx}`} x1={gx} y1={0} x2={gx} y2={h} stroke={colors.border} strokeWidth={1} />);
    }
    for (let gy = GRID; gy < h; gy += GRID) {
      gridLines.push(<Line key={`gy${gy}`} x1={0} y1={gy} x2={w} y2={gy} stroke={colors.border} strokeWidth={1} />);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable testID="schema-cancel" onPress={() => router.back()} style={styles.hBtn}>
          <X color={colors.onSurface} size={22} weight="bold" />
        </Pressable>
        <Text style={styles.hTitle}>Schema impianto</Text>
        <Pressable testID="schema-save" onPress={save} style={[styles.hBtn, styles.saveBtn]}>
          <Check color={colors.onBrandPrimary} size={20} weight="bold" />
        </Pressable>
      </View>

      {/* Canvas */}
      <View
        testID="schema-canvas"
        style={styles.canvas}
        onLayout={(e) => onCanvasLayout(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}
      >
        <Svg style={{ position: "absolute", width: "100%", height: "100%" }}>
          <Rect
            x={0}
            y={0}
            width={canvasRef.current.w}
            height={canvasRef.current.h}
            fill={schema.background}
            onPress={Platform.OS === "web" ? undefined : () => setSelectedId(null)}
          />
          {gridLines}
          {lines.map((l) => {
            const resolved = resolveLine(l.points, schema.elements);
            if (resolved.length < 2) return null;
            const pts = resolved.map((p) => `${p.x},${p.y}`).join(" ");
            return (
              <Polyline
                key={l.id}
                points={pts}
                fill="none"
                stroke={l.id === selectedId ? colors.brandPrimary : l.color}
                strokeWidth={l.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                onPress={Platform.OS === "web" ? undefined : () => !lineMode && setSelectedId(l.id)}
              />
            );
          })}
          {lineMode
            ? symbols.flatMap((el) =>
                PORT_KEYS.map((port) => {
                  const w = symbolPortWorld(el, port);
                  return (
                    <Circle
                      key={`${el.id}-${port}`}
                      cx={w.x}
                      cy={w.y}
                      r={5}
                      fill={colors.brandPrimary}
                      opacity={0.55}
                    />
                  );
                }),
              )
            : null}
          {draftPts.length > 0 ? (
            <Polyline
              points={draftPts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={color}
              strokeWidth={lineW}
              strokeLinecap="round"
              strokeDasharray="6 6"
            />
          ) : null}
        </Svg>

        {/* Tap overlay for line mode */}
        {lineMode ? (
          Platform.OS === "web" ? (
            <View
              style={{ position: "absolute", width: "100%", height: "100%" }}
              {...({
                onClick: (e: any) => onCanvasTap(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
              } as any)}
            />
          ) : (
            <View
              style={{ position: "absolute", width: "100%", height: "100%" }}
              onStartShouldSetResponder={() => true}
              onResponderRelease={(e) => onCanvasTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
            />
          )
        ) : null}

        {symbols.map((el) => (
          <DraggableSymbol
            key={el.id}
            el={el}
            selected={el.id === selectedId}
            draggable={!lineMode}
            canvas={canvasRef.current}
            grid={grid}
            onSelect={() => setSelectedId(el.id)}
            onMove={(x, y) =>
              mutate((els) => els.map((e) => (e.id === el.id ? { ...e, x, y } : e)))
            }
          />
        ))}

        {labels.map((el) => (
          <DraggableLabel
            key={el.id}
            el={el}
            selected={el.id === selectedId}
            draggable={!lineMode}
            canvas={canvasRef.current}
            grid={grid}
            onSelect={() => setSelectedId(el.id)}
            onMove={(x, y) =>
              mutate((els) => els.map((e) => (e.id === el.id ? { ...e, x, y } : e)))
            }
          />
        ))}

        {schema.elements.length === 0 && draftPts.length === 0 ? (
          <View style={styles.hint} pointerEvents="none">
            <Text style={styles.hintText}>Aggiungi simboli dalla barra in basso{"\n"}o disegna le tubazioni con «Linea»</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom toolbar */}
      <KeyboardStickyView>
        <View style={[styles.toolbar, { paddingBottom: insets.bottom + spacing.sm }]}>
        {selected && selected.kind === "symbol" ? (
          <>
            <Text style={styles.tLabel}>Simbolo selezionato</Text>
            <Swatches value={selected.color} onPick={(c) => updateSelected({ color: c })} />
            <View style={styles.actions}>
              <IconBtn testID="sym-smaller" icon={<Minus color={colors.onSurface} size={18} weight="bold" />} onPress={() => updateSelected({ size: clamp((selected.size as number) - 8, 24, 160) })} />
              <IconBtn testID="sym-bigger" icon={<Plus color={colors.onSurface} size={18} weight="bold" />} onPress={() => updateSelected({ size: clamp((selected.size as number) + 8, 24, 160) })} />
              <IconBtn testID="sym-rotate" icon={<ArrowClockwise color={colors.onSurface} size={18} weight="bold" />} onPress={() => updateSelected({ rotation: (((selected.rotation as number) || 0) + 45) % 360 })} />
              <IconBtn testID="sym-delete" danger icon={<Trash color={colors.onError} size={18} weight="bold" />} onPress={deleteSelected} />
              <Pressable testID="sym-done" style={styles.doneBtn} onPress={() => setSelectedId(null)}>
                <Text style={styles.doneText}>Fine</Text>
              </Pressable>
            </View>
          </>
        ) : selected && selected.kind === "line" ? (
          <>
            <Text style={styles.tLabel}>Linea selezionata</Text>
            <Swatches value={selected.color} onPick={(c) => updateSelected({ color: c })} />
            <View style={styles.actions}>
              <IconBtn testID="line-thin" icon={<Minus color={colors.onSurface} size={18} weight="bold" />} onPress={() => updateSelected({ width: clamp((selected.width as number) - 1, 2, 14) })} />
              <IconBtn testID="line-thick" icon={<Plus color={colors.onSurface} size={18} weight="bold" />} onPress={() => updateSelected({ width: clamp((selected.width as number) + 1, 2, 14) })} />
              <IconBtn testID="line-delete" danger icon={<Trash color={colors.onError} size={18} weight="bold" />} onPress={deleteSelected} />
              <Pressable testID="line-done" style={styles.doneBtn} onPress={() => setSelectedId(null)}>
                <Text style={styles.doneText}>Fine</Text>
              </Pressable>
            </View>
          </>
        ) : selected && selected.kind === "label" ? (
          <>
            <Text style={styles.tLabel}>Etichetta</Text>
            <TextField
              testID="label-text-input"
              value={selected.text}
              onChangeText={(t) => updateSelected({ text: t })}
              placeholder="es. mandata 70°C"
            />
            <Swatches value={selected.color} onPick={(c) => updateSelected({ color: c })} />
            <View style={styles.actions}>
              <IconBtn testID="label-smaller" icon={<Minus color={colors.onSurface} size={18} weight="bold" />} onPress={() => updateSelected({ size: clamp((selected.size as number) - 2, 10, 48) })} />
              <IconBtn testID="label-bigger" icon={<Plus color={colors.onSurface} size={18} weight="bold" />} onPress={() => updateSelected({ size: clamp((selected.size as number) + 2, 10, 48) })} />
              <IconBtn testID="label-delete" danger icon={<Trash color={colors.onError} size={18} weight="bold" />} onPress={deleteSelected} />
              <Pressable testID="label-done" style={styles.doneBtn} onPress={() => setSelectedId(null)}>
                <Text style={styles.doneText}>Fine</Text>
              </Pressable>
            </View>
          </>
        ) : lineMode ? (
          <>
            <Text style={styles.tLabel}>Tocca il foglio per aggiungere punti ({draftPts.length})</Text>
            <Swatches value={color} onPick={setColor} />
            <View style={styles.actions}>
              <IconBtn testID="line-undo-pt" icon={<X color={colors.onSurface} size={18} weight="bold" />} onPress={() => setDraftPts((p) => p.slice(0, -1))} />
              <Pressable testID="line-finish" style={[styles.doneBtn, { backgroundColor: colors.brandPrimary }]} onPress={commitLine}>
                <Text style={[styles.doneText, { color: colors.onBrandPrimary }]}>Termina linea</Text>
              </Pressable>
              <Pressable testID="line-abort" style={styles.doneBtn} onPress={() => { setDraftPts([]); setLineMode(false); }}>
                <Text style={styles.doneText}>Annulla</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.topRow}>
              <Pressable testID="start-line" style={styles.lineBtn} onPress={() => { setSelectedId(null); setLineMode(true); }}>
                <PencilLine color={colors.onBrandPrimary} size={18} weight="bold" />
                <Text style={styles.lineBtnText}>Linea</Text>
              </Pressable>
              <Pressable testID="add-label" style={styles.secBtn} onPress={addLabel}>
                <TextT color={colors.onSurface} size={18} weight="bold" />
                <Text style={styles.secText}>Testo</Text>
              </Pressable>
              <Pressable testID="toggle-grid" style={[styles.secBtn, grid && styles.secActive]} onPress={() => setGrid((g) => !g)}>
                <GridFour color={grid ? colors.onBrandPrimary : colors.onSurface} size={18} weight="bold" />
                <Text style={[styles.secText, grid && styles.secTextActive]}>Griglia</Text>
              </Pressable>
            </View>
            <Swatches value={color} onPick={setColor} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.palette}>
              {SYMBOL_PALETTE.map((s) => (
                <Pressable key={s.key} testID={`add-symbol-${s.key}`} style={styles.palItem} onPress={() => addSymbol(s.key)}>
                  <SvgXml xml={symbolSvg(s.key, colors.onSurface, 38)} width={38} height={38} />
                  <Text style={styles.palLabel} numberOfLines={1}>{s.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
        </View>
      </KeyboardStickyView>
    </View>
  );
}

function Swatches({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  const styles = useStyles();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatches}>
      {SCHEMA_COLORS.map((c) => (
        <Pressable
          key={c}
          testID={`swatch-${c}`}
          onPress={() => onPick(c)}
          style={[styles.swatch, { backgroundColor: c }, value === c && styles.swatchActive]}
        />
      ))}
    </ScrollView>
  );
}

function IconBtn({
  icon,
  onPress,
  danger,
  testID,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
  testID?: string;
}) {
  const styles = useStyles();
  return (
    <Pressable testID={testID} onPress={onPress} style={[styles.iconBtn, danger && styles.iconBtnDanger]}>
      {icon}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.md },
  saveBtn: { backgroundColor: colors.brandPrimary },
  hTitle: { fontSize: 17, fontWeight: "800", color: colors.onSurface },
  canvas: { flex: 1, backgroundColor: "#FFFFFF", margin: spacing.md, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  hint: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  hintText: { color: colors.muted, textAlign: "center", fontSize: 14, lineHeight: 20 },
  toolbar: {
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  tLabel: { fontSize: 13, fontWeight: "700", color: colors.muted },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  lineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  lineBtnText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: 14 },
  secBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  secActive: { backgroundColor: colors.brandPrimary },
  secText: { color: colors.onSurface, fontWeight: "700", fontSize: 14 },
  secTextActive: { color: colors.onBrandPrimary },
  palette: { gap: spacing.md, paddingVertical: spacing.xs, paddingRight: spacing.md },
  palItem: { alignItems: "center", width: 60, gap: 2 },
  palLabel: { fontSize: 10, color: colors.muted, textAlign: "center" },
  swatches: { gap: spacing.sm, alignItems: "center", paddingVertical: spacing.xs },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.surfaceSecondary },
  swatchActive: { borderColor: colors.onSurface, transform: [{ scale: 1.12 }] },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconBtn: { width: 46, height: 42, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  iconBtnDanger: { backgroundColor: colors.error },
  doneBtn: { paddingHorizontal: spacing.md, height: 42, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" },
  doneText: { fontWeight: "700", color: colors.onSurface, fontSize: 14 },
}));
