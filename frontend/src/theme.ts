// Design tokens for this app. Light theme only.
//
// Keys match the "color" block of /app/design_guidelines.json.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#F7F9FC",
  onSurface: "#14213D",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#14213D",
  surfaceTertiary: "#EEF2F7",
  onSurfaceTertiary: "#14213D",
  surfaceInverse: "#0B2F5E",
  onSurfaceInverse: "#F7F9FC",
  muted: "#66738A",

  brand: "#0A56AC",
  onBrand: "#FFFFFF",
  brandPrimary: "#0A56AC",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#4F86C9",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#E3EDF9",
  onBrandTertiary: "#0A56AC",

  success: "#3A9A50",
  onSuccess: "#FFFFFF",
  warning: "#E8801E",
  onWarning: "#FFFFFF",
  error: "#C0392B",
  onError: "#FFFFFF",
  info: "#3D4A5C",
  onInfo: "#FFFFFF",

  border: "#DDE3EC",
  borderStrong: "#AEB8C8",
  divider: "#DDE3EC",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;
