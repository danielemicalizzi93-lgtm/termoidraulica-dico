import type { SchemaT } from "@/src/schema/render";

// Lightweight holder to pass the schema being edited between the wizard
// and the full-screen schema editor without serialising it through route params.
let current: SchemaT | null = null;

export const schemaDraft = {
  get(): SchemaT | null {
    return current;
  },
  set(value: SchemaT | null) {
    current = value;
  },
};

export const SCHEMA_COLORS = [
  "#0B6FB8", // acqua fredda
  "#C0392B", // acqua calda / mandata
  "#1F8A4C", // gas
  "#E67E22", // ritorno
  "#8E44AD", // ricircolo
  "#F1C40F", // segnali
  "#1C1C1A", // nero
  "#7F8C8D", // grigio
];
