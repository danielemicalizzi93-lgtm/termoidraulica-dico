// Design tokens for this app. Light theme only.
//
// Keys match the "color" block of /app/design_guidelines.json.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#F9F9F8",
  onSurface: "#1C1C1A",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#1C1C1A",
  surfaceTertiary: "#F0F0EE",
  onSurfaceTertiary: "#1C1C1A",
  surfaceInverse: "#1C1C1A",
  onSurfaceInverse: "#F9F9F8",
  muted: "#73736D",

  brand: "#C54B3C",
  onBrand: "#FFFFFF",
  brandPrimary: "#C54B3C",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#D87D71",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#F5DFDC",
  onBrandTertiary: "#C54B3C",

  success: "#3E8351",
  onSuccess: "#FFFFFF",
  warning: "#D19F30",
  onWarning: "#FFFFFF",
  error: "#B33A3A",
  onError: "#FFFFFF",
  info: "#4A4A45",
  onInfo: "#FFFFFF",

  border: "#E3E3E0",
  borderStrong: "#B8B8B5",
  divider: "#E3E3E0",
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
