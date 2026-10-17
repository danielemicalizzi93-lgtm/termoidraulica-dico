// Hydraulic / thermo-hydraulic symbols as SVG markup (viewBox 0 0 64 64).
// The SAME markup is used in the on-device editor (react-native-svg SvgXml)
// and in the exported PDF (inline SVG), so symbols stay vector and colorable.

export type SymbolKey = string;

// Returns inner SVG shapes (coords 0..64) coloured with `c`.
function inner(key: SymbolKey, c: string): string {
  const stroke = `fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  const fill = `fill="${c}"`;
  const map: Record<string, string> = {
    valvola: `<g ${stroke}><path d="M8 20 L8 44 L32 32 Z"/><path d="M56 20 L56 44 L32 32 Z"/><line x1="8" y1="32" x2="8" y2="32"/></g>`,
    valvola_sfera: `<g ${stroke}><path d="M10 22 L10 42 L32 32 Z"/><path d="M54 22 L54 42 L32 32 Z"/></g><circle cx="32" cy="32" r="6" ${fill}/>`,
    ritegno: `<g ${stroke}><line x1="6" y1="32" x2="58" y2="32"/><path d="M22 20 L22 44 L44 32 Z"/><line x1="44" y1="18" x2="44" y2="46"/></g>`,
    saracinesca: `<g ${stroke}><path d="M10 22 L10 42 L32 32 Z"/><path d="M54 22 L54 42 L32 32 Z"/><line x1="32" y1="24" x2="32" y2="8"/><line x1="24" y1="8" x2="40" y2="8"/></g>`,
    pompa: `<circle cx="32" cy="32" r="18" ${stroke}/><path d="M26 22 L26 42 L46 32 Z" ${fill}/>`,
    caldaia: `<g ${stroke}><rect x="12" y="12" width="40" height="40" rx="4"/><path d="M32 44 C24 38 28 30 32 24 C36 30 40 38 32 44 Z"/></g>`,
    radiatore: `<g ${stroke}><rect x="10" y="18" width="44" height="28" rx="2"/><line x1="20" y1="18" x2="20" y2="46"/><line x1="28" y1="18" x2="28" y2="46"/><line x1="36" y1="18" x2="36" y2="46"/><line x1="44" y1="18" x2="44" y2="46"/></g>`,
    accumulo: `<g ${stroke}><rect x="20" y="10" width="24" height="44" rx="12"/><line x1="20" y1="22" x2="44" y2="22"/></g>`,
    tee: `<g ${stroke}><path d="M6 24 H58"/><path d="M32 24 V56"/></g>`,
    gomito: `<path d="M14 54 V24 H50" ${stroke}/>`,
    manometro: `<circle cx="32" cy="34" r="16" ${stroke}/><line x1="32" y1="34" x2="43" y2="24" ${stroke}/><line x1="32" y1="50" x2="32" y2="58" ${stroke}/>`,
    termometro: `<rect x="29" y="12" width="6" height="30" rx="3" ${stroke}/><circle cx="32" cy="46" r="9" ${stroke}/><circle cx="32" cy="46" r="4" ${fill}/>`,
    rubinetto: `<g ${stroke}><path d="M14 44 H50"/><path d="M32 44 V22"/><path d="M22 18 H42"/><path d="M32 22 L24 30 M32 22 L40 30"/></g>`,
    filtro: `<g ${stroke}><rect x="16" y="18" width="32" height="28" rx="2"/><path d="M16 18 L48 46 M48 18 L16 46"/></g>`,
    collettore: `<g ${stroke}><rect x="6" y="26" width="52" height="10" rx="5"/><line x1="16" y1="36" x2="16" y2="52"/><line x1="32" y1="36" x2="32" y2="52"/><line x1="48" y1="36" x2="48" y2="52"/></g>`,
    miscelatore: `<g ${stroke}><path d="M10 22 L10 42 L32 32 Z"/><path d="M54 22 L54 42 L32 32 Z"/><path d="M22 54 L42 54 L32 34 Z"/></g>`,
    scambiatore: `<g ${stroke}><rect x="10" y="16" width="44" height="32" rx="3"/><path d="M14 24 H50 M14 32 H50 M14 40 H50"/></g>`,
    vaso: `<g ${stroke}><rect x="20" y="14" width="24" height="36" rx="4"/><line x1="20" y1="30" x2="44" y2="30"/></g>`,
  };
  return map[key] ?? map.valvola;
}

export function symbolInner(key: SymbolKey, color: string): string {
  return inner(key, color);
}

export function symbolSvg(key: SymbolKey, color: string, size = 64): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${inner(key, color)}</svg>`;
}

export const SYMBOL_PALETTE: { key: SymbolKey; label: string }[] = [
  { key: "valvola", label: "Valvola" },
  { key: "valvola_sfera", label: "Valv. sfera" },
  { key: "ritegno", label: "Ritegno" },
  { key: "saracinesca", label: "Saracinesca" },
  { key: "miscelatore", label: "Miscelatore" },
  { key: "pompa", label: "Pompa" },
  { key: "caldaia", label: "Caldaia" },
  { key: "radiatore", label: "Radiatore" },
  { key: "accumulo", label: "Accumulo" },
  { key: "vaso", label: "Vaso espans." },
  { key: "scambiatore", label: "Scambiatore" },
  { key: "collettore", label: "Collettore" },
  { key: "tee", label: "Raccordo T" },
  { key: "gomito", label: "Gomito" },
  { key: "rubinetto", label: "Rubinetto" },
  { key: "filtro", label: "Filtro" },
  { key: "manometro", label: "Manometro" },
  { key: "termometro", label: "Termometro" },
];
