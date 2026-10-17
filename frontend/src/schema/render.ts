import { PORTS, symbolInner, type SymbolKey } from "@/src/schema/symbols";

export type FreePoint = { x: number; y: number };
export type PortRef = { sym: string; port: string };
export type LinePoint = FreePoint | PortRef;
export type Point = FreePoint;

export function isPortRef(p: LinePoint): p is PortRef {
  return (p as PortRef).sym !== undefined;
}

export type SchemaElement =
  | {
      id: string;
      kind: "symbol";
      symbol: SymbolKey;
      x: number;
      y: number;
      size: number;
      color: string;
      rotation: number;
    }
  | {
      id: string;
      kind: "line";
      points: LinePoint[];
      color: string;
      width: number;
    }
  | {
      id: string;
      kind: "label";
      x: number;
      y: number;
      text: string;
      color: string;
      size: number;
    };

export type SymbolEl = Extract<SchemaElement, { kind: "symbol" }>;

export type SchemaT = {
  canvas: { w: number; h: number };
  background: string;
  elements: SchemaElement[];
};

export function emptySchema(w = 600, h = 420): SchemaT {
  return { canvas: { w, h }, background: "#FFFFFF", elements: [] };
}

export function isEmptySchema(s?: SchemaT | null): boolean {
  return !s || !s.elements || s.elements.length === 0;
}

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// World coordinates of a symbol connection port (accounts for size + rotation).
export function symbolPortWorld(sym: SymbolEl, portKey: string): FreePoint {
  const p = PORTS[portKey] || { x: 32, y: 32 };
  const s = sym.size / 64;
  const rot = ((sym.rotation || 0) * Math.PI) / 180;
  const dx = p.x - 32;
  const dy = p.y - 32;
  const rx = dx * Math.cos(rot) - dy * Math.sin(rot);
  const ry = dx * Math.sin(rot) + dy * Math.cos(rot);
  return { x: sym.x + s * (32 + rx), y: sym.y + s * (32 + ry) };
}

// Resolve a line point (free or bound to a symbol port) to absolute coords.
export function resolveLinePoint(pt: LinePoint, elements: SchemaElement[]): FreePoint | null {
  if (isPortRef(pt)) {
    const s = elements.find((e) => e.kind === "symbol" && e.id === pt.sym) as SymbolEl | undefined;
    return s ? symbolPortWorld(s, pt.port) : null;
  }
  return { x: pt.x, y: pt.y };
}

export function resolveLine(points: LinePoint[], elements: SchemaElement[]): FreePoint[] {
  return points
    .map((p) => resolveLinePoint(p, elements))
    .filter((p): p is FreePoint => p !== null);
}

// Build one composed SVG string for the whole schema (used in PDF + thumbnails).
export function buildSchemaSvg(schema: SchemaT): string {
  const { w, h } = schema.canvas;
  const bg = schema.background || "#FFFFFF";
  const parts: string[] = [`<rect x="0" y="0" width="${w}" height="${h}" fill="${bg}"/>`];

  for (const el of schema.elements) {
    if (el.kind === "line") {
      const resolved = resolveLine(el.points, schema.elements);
      if (resolved.length < 2) continue;
      const pts = resolved.map((p) => `${p.x},${p.y}`).join(" ");
      parts.push(
        `<polyline points="${pts}" fill="none" stroke="${el.color}" stroke-width="${el.width}" stroke-linecap="round" stroke-linejoin="round"/>`,
      );
    } else if (el.kind === "symbol") {
      const s = el.size / 64;
      parts.push(
        `<g transform="translate(${el.x},${el.y}) scale(${s}) rotate(${el.rotation || 0} 32 32)">${symbolInner(el.symbol, el.color)}</g>`,
      );
    } else if (el.kind === "label") {
      parts.push(
        `<text x="${el.x}" y="${el.y + el.size * 0.8}" fill="${el.color}" font-size="${el.size}" font-weight="600" font-family="Helvetica, Arial, sans-serif">${esc(el.text)}</text>`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${parts.join("")}</svg>`;
}
