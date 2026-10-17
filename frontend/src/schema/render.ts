import { symbolInner, type SymbolKey } from "@/src/schema/symbols";

export type Point = { x: number; y: number };

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
      points: Point[];
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

// Build one composed SVG string for the whole schema (used in PDF + thumbnails).
export function buildSchemaSvg(schema: SchemaT): string {
  const { w, h } = schema.canvas;
  const bg = schema.background || "#FFFFFF";
  const parts: string[] = [`<rect x="0" y="0" width="${w}" height="${h}" fill="${bg}"/>`];

  for (const el of schema.elements) {
    if (el.kind === "line") {
      const pts = el.points.map((p) => `${p.x},${p.y}`).join(" ");
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
        `<text x="${el.x}" y="${el.y}" fill="${el.color}" font-size="${el.size}" font-family="Helvetica, Arial, sans-serif">${esc(el.text)}</text>`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${parts.join("")}</svg>`;
}
