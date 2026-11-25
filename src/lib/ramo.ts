// ============================================================
//  "Arma tu ramo": opciones, precio estimado y dibujo del ramo.
//  Lo usan la página /arma-tu-ramo y el avance del inicio.
//  El dibujo es una ilustración vectorial (SVG) hecha por capas:
//  papel trasero → follaje → flores → paniculata → papel delantero
//  → lazo → detalles (globo, peluche, chocolates, espumante).
// ============================================================

export const FLORES = [
  { id: "rosas", label: "Rosas" },
  { id: "girasoles", label: "Girasoles" },
  { id: "tulipanes", label: "Tulipanes" },
  { id: "lirios", label: "Lirios" },
  { id: "gerberas", label: "Gerberas" },
  { id: "mixto", label: "Mixto" },
] as const;

export const COLORES = [
  { id: "rojo", label: "Rojo", hex: "#b3202f" },
  { id: "rosado", label: "Rosado", hex: "#ef7f9f" },
  { id: "blanco", label: "Blanco", hex: "#f7f2ea" },
  { id: "amarillo", label: "Amarillo", hex: "#f3c23c" },
  { id: "lila", label: "Lila", hex: "#a27bc2" },
  { id: "mixto", label: "Mixto", hex: "" },
] as const;

export const TAMANOS = [
  { id: "s", label: "Pequeño", detalle: "6 flores", flores: 6 },
  { id: "m", label: "Mediano", detalle: "12 flores", flores: 12 },
  { id: "l", label: "Grande", detalle: "24 flores", flores: 24 },
  { id: "xl", label: "Especial", detalle: "50 flores", flores: 50 },
] as const;

export const PRESENTACIONES = [
  { id: "coreano", label: "Papel coreano", conColor: true },
  { id: "kraft", label: "Papel kraft", conColor: false },
  { id: "caja", label: "Caja sombrerera", conColor: true },
  { id: "canasta", label: "Canasta", conColor: false },
] as const;

export const PAPELES = [
  { id: "rosa", label: "Rosa", hex: "#f5c7c4" },
  { id: "blanco", label: "Blanco", hex: "#f7f5f1" },
  { id: "negro", label: "Negro", hex: "#2e292b" },
  { id: "lila", label: "Lila", hex: "#cdb6df" },
] as const;

export const DETALLES = [
  { id: "chocolates", label: "Chocolates" },
  { id: "peluche", label: "Peluche" },
  { id: "globo", label: "Globo" },
  { id: "espumante", label: "Espumante" },
] as const;

export type Ramo = {
  flor: string;
  color: string;
  tamano: string;
  presentacion: string;
  papel: string;
  detalles: string[];
  tarjeta?: boolean;
};

export const RAMO_INICIAL: Ramo = { flor: "rosas", color: "rojo", tamano: "m", presentacion: "coreano", papel: "rosa", detalles: [] };

// ------------------------------------------------------------
//  Precio estimado (opcional). Mientras los valores sean null,
//  la web no muestra precio y se confirma por WhatsApp.
//  Ejemplo: base: { s: 69, m: 119, l: 199, xl: 389 }
// ------------------------------------------------------------
export const PRECIOS: {
  base: Record<string, number> | null;          // por tamaño
  flor: Record<string, number>;                  // recargo por tipo de flor (multiplica la base)
  presentacion: Record<string, number>;          // recargo fijo
  detalles: Record<string, number>;              // precio de cada detalle
} = {
  base: null,
  flor: { rosas: 1, girasoles: 1, tulipanes: 1.3, lirios: 1.2, gerberas: 0.9, mixto: 1.1 },
  presentacion: { coreano: 0, kraft: 0, caja: 30, canasta: 25 },
  detalles: { chocolates: 35, peluche: 45, globo: 30, espumante: 59 },
};

export function precioEstimado(r: Ramo): number | null {
  if (!PRECIOS.base) return null;
  const base = PRECIOS.base[r.tamano] ?? 0;
  const total =
    base * (PRECIOS.flor[r.flor] ?? 1) +
    (PRECIOS.presentacion[r.presentacion] ?? 0) +
    r.detalles.reduce((s, d) => s + (PRECIOS.detalles[d] ?? 0), 0);
  return Math.round(total);
}

// ------------------------------------------------------------
//  Utilidades de color
// ------------------------------------------------------------
const MIX = ["#b3202f", "#ef7f9f", "#f7f2ea", "#f3c23c", "#a27bc2"];
const TIPOS_MIX = ["rosas", "gerberas", "lirios", "rosas", "tulipanes"];

const hexRgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const toHex = (c: number[]) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
/** k < 1 oscurece, k > 1 aclara (mezclando con blanco). */
export function tone(hex: string, k: number) {
  const c = hexRgb(hex);
  return k <= 1 ? toHex(c.map((v) => v * k)) : toHex(c.map((v) => v + (255 - v) * (k - 1)));
}
const isLight = (hex: string) => {
  const [r, g, b] = hexRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 200;
};

function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}
const f1 = (n: number) => n.toFixed(1);

// Pétalo base (apunta hacia arriba, mide 1): ancho w, punta redonda o aguda
const PETALO = (w: number, aguda = false) =>
  aguda
    ? `M0 0C${-w} -.32 ${-w * 0.55} -.82 0 -1C${w * 0.55} -.82 ${w} -.32 0 0Z`
    : `M0 0C${-w} -.28 ${-w * 1.08} -.86 0 -1C${w * 1.08} -.86 ${w} -.28 0 0Z`;

// ------------------------------------------------------------
//  Flores (coordenadas locales, radio r)
// ------------------------------------------------------------
type Ctx = { p: string; grad: (hex: string, garganta?: boolean, vertical?: boolean) => string };

function anillo(n: number, escala: number, giro: number, path: string, fill: string, stroke: string, extra = "") {
  let out = "";
  for (let i = 0; i < n; i++) {
    out += `<path d="${path}" transform="rotate(${f1(giro + (i * 360) / n)}) scale(${f1(escala)})" fill="${fill}" stroke="${stroke}" stroke-width=".7" vector-effect="non-scaling-stroke"${extra}/>`;
  }
  return out;
}

function rosa(c: Ctx, r: number, hex: string, giro: number) {
  const g = c.grad(hex);
  const borde = tone(hex, isLight(hex) ? 0.82 : 0.62);
  const centro = tone(hex, isLight(hex) ? 0.8 : 0.55);
  return (
    anillo(7, r, giro, PETALO(0.66), `url(#${g})`, borde) +
    anillo(6, r * 0.8, giro + 26, PETALO(0.62), `url(#${g})`, borde) +
    anillo(5, r * 0.6, giro + 50, PETALO(0.6), `url(#${g})`, borde) +
    `<circle r="${f1(r * 0.36)}" fill="url(#${c.p}-core-${g})"/>` +
    `<path d="M${f1(-r * 0.2)} ${f1(r * 0.06)}C${f1(-r * 0.22)} ${f1(-r * 0.2)} ${f1(r * 0.12)} ${f1(-r * 0.26)} ${f1(r * 0.17)} ${f1(-r * 0.04)}C${f1(r * 0.2)} ${f1(r * 0.12)} ${f1(-r * 0.02)} ${f1(r * 0.2)} ${f1(-r * 0.06)} ${f1(r * 0.02)}" fill="none" stroke="${centro}" stroke-width="1.2" stroke-linecap="round" transform="rotate(${f1(giro)})"/>` +
    `<ellipse cx="${f1(-r * 0.28)}" cy="${f1(-r * 0.42)}" rx="${f1(r * 0.22)}" ry="${f1(r * 0.1)}" fill="#fff" opacity=".18" transform="rotate(-30)"/>`
  );
}

function gerbera(c: Ctx, r: number, hex: string, giro: number) {
  const g = c.grad(hex);
  const borde = tone(hex, 0.75);
  return (
    anillo(20, r, giro, PETALO(0.2, true), `url(#${g})`, borde) +
    anillo(20, r * 0.78, giro + 9, PETALO(0.2, true), `url(#${g})`, borde, ` opacity=".95"`) +
    `<circle r="${f1(r * 0.34)}" fill="#e2a72e"/><circle r="${f1(r * 0.34)}" fill="none" stroke="#c78a1c" stroke-width="1.5" stroke-dasharray="1.4 1.6"/>` +
    `<circle r="${f1(r * 0.2)}" fill="url(#${c.p}-seed)"/>`
  );
}

function girasol(c: Ctx, r: number, giro: number) {
  return (
    anillo(16, r, giro, PETALO(0.3, true), `url(#${c.p}-sun)`, "#c98a12") +
    anillo(16, r * 0.84, giro + 11, PETALO(0.3, true), `url(#${c.p}-sun)`, "#c98a12") +
    `<circle r="${f1(r * 0.46)}" fill="url(#${c.p}-seed)"/>` +
    Array.from({ length: 22 }, (_, i) => {
      const a = i * 2.39996, d = Math.sqrt((i + 0.5) / 22) * r * 0.38;
      return `<circle cx="${f1(Math.cos(a) * d)}" cy="${f1(Math.sin(a) * d)}" r="${f1(r * 0.035)}" fill="#a06a2c" opacity=".75"/>`;
    }).join("")
  );
}

function lirio(c: Ctx, r: number, hex: string, giro: number) {
  const g = c.grad(hex, true);
  const borde = tone(hex, isLight(hex) ? 0.8 : 0.66);
  const motas = tone(hex, isLight(hex) ? 0.55 : 0.5);
  const rr = r * 1.18;
  let out = anillo(3, rr, giro, PETALO(0.34, true), `url(#${g})`, borde) + anillo(3, rr * 0.92, giro + 60, PETALO(0.34, true), `url(#${g})`, borde);
  for (let i = 0; i < 6; i++) {
    const a = ((giro + i * 60 + 8) * Math.PI) / 180;
    out += `<circle cx="${f1(Math.sin(a) * rr * 0.32)}" cy="${f1(-Math.cos(a) * rr * 0.32)}" r="1.1" fill="${motas}"/><circle cx="${f1(Math.sin(a - 0.2) * rr * 0.45)}" cy="${f1(-Math.cos(a - 0.2) * rr * 0.45)}" r=".9" fill="${motas}"/>`;
  }
  for (let i = 0; i < 6; i++) {
    const a = ((giro + 30 + i * 60) * Math.PI) / 180;
    const x = Math.sin(a) * rr * 0.5, y = -Math.cos(a) * rr * 0.5;
    out += `<path d="M0 0Q${f1(x * 0.4)} ${f1(y * 0.6)} ${f1(x)} ${f1(y)}" stroke="#d7d39a" stroke-width="1.1" fill="none"/><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="2.4" ry="1.2" fill="#9a4a1e" transform="rotate(${f1(giro + 30 + i * 60)} ${f1(x)} ${f1(y)})"/>`;
  }
  return out + `<circle r="${f1(r * 0.08)}" fill="#cfd59a"/>`;
}

function tulipan(c: Ctx, r: number, hex: string) {
  const g = c.grad(hex, false, true);
  const gs = c.grad(tone(hex, 0.86), false, true);
  const borde = tone(hex, 0.7);
  const P = "M-.5 -.18C-.56 .42 -.24 .66 0 .66C.24 .66 .56 .42 .5 -.18C.34 -.5 .14 -.92 0 -1C-.14 -.92 -.34 -.5 -.5 -.18Z";
  return (
    `<path d="${P}" transform="translate(${f1(-r * 0.3)} ${f1(r * 0.02)}) rotate(-14) scale(${f1(r * 0.9)})" fill="url(#${gs})" stroke="${borde}" stroke-width=".7" vector-effect="non-scaling-stroke"/>` +
    `<path d="${P}" transform="translate(${f1(r * 0.3)} ${f1(r * 0.02)}) rotate(14) scale(${f1(r * 0.9)})" fill="url(#${gs})" stroke="${borde}" stroke-width=".7" vector-effect="non-scaling-stroke"/>` +
    `<path d="${P}" transform="scale(${f1(r)})" fill="url(#${g})" stroke="${borde}" stroke-width=".7" vector-effect="non-scaling-stroke"/>` +
    `<path d="M0 ${f1(-r * 0.9)}Q${f1(-r * 0.12)} ${f1(-r * 0.2)} 0 ${f1(r * 0.6)}" stroke="#fff" stroke-opacity=".28" stroke-width="1.6" fill="none"/>`
  );
}

// ------------------------------------------------------------
//  Follaje y paniculata
// ------------------------------------------------------------
function hoja(c: Ctx, x: number, y: number, largo: number, ang: number, sage: boolean) {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})"><path d="M0 0C${f1(largo * 0.3)} ${f1(-largo * 0.28)} ${f1(largo * 0.24)} ${f1(-largo * 0.8)} 0 ${f1(-largo)}C${f1(-largo * 0.24)} ${f1(-largo * 0.8)} ${f1(-largo * 0.3)} ${f1(-largo * 0.28)} 0 0Z" fill="url(#${c.p}-${sage ? "sage" : "leaf"})"/><path d="M0 0Q${f1(largo * 0.04)} ${f1(-largo * 0.5)} 0 ${f1(-largo * 0.94)}" stroke="#fff" stroke-opacity=".28" stroke-width=".9" fill="none"/></g>`;
}

function eucalipto(c: Ctx, x: number, y: number, largo: number, ang: number) {
  let out = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})"><path d="M0 0Q${f1(largo * 0.08)} ${f1(-largo * 0.5)} 0 ${f1(-largo)}" stroke="#6f8f78" stroke-width="1.3" fill="none"/>`;
  for (let i = 1; i <= 5; i++) {
    const t = i / 5.4, ry = -largo * t, s = 1 - t * 0.45, lado = i % 2 ? 1 : -1;
    out += `<ellipse cx="${f1(lado * 6 * s)}" cy="${f1(ry)}" rx="${f1(7 * s)}" ry="${f1(5.4 * s)}" fill="url(#${c.p}-euca)" transform="rotate(${lado * 22} ${f1(lado * 6 * s)} ${f1(ry)})"/>`;
  }
  return out + "</g>";
}

function paniculata(x: number, y: number, rand: () => number) {
  let out = "";
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2, d = 4 + rand() * 11;
    out += `<circle cx="${f1(x + Math.cos(a) * d)}" cy="${f1(y + Math.sin(a) * d)}" r="${f1(1.2 + rand() * 1.3)}" fill="#fffdf9" stroke="#ddd2c6" stroke-width=".5" opacity=".92"/>`;
  }
  return out;
}

// ------------------------------------------------------------
//  Presentaciones
// ------------------------------------------------------------
type Base = { cx: number; cy: number; rx: number; ry: number };

function papelAtras(c: Ctx, color: string, kraft: boolean) {
  // abanico de pliegos detrás de las flores
  const claro = kraft ? "#f4efe6" : tone(color, isLight(color) ? 0.97 : 1.5);
  const tonos = [color, claro, tone(color, 0.92), claro, color, tone(color, 0.92), claro];
  let out = "";
  const N = 7;
  for (let i = 0; i < N; i++) {
    const a0 = -152 + (i * 124) / N, a1 = a0 + 124 / N + 8;
    const R = 270 - Math.abs(i - 3) * 12;
    const p = (a: number, rr: number) => [200 + Math.cos((a * Math.PI) / 180) * rr * 0.66, 338 + Math.sin((a * Math.PI) / 180) * rr];
    const [x0, y0] = p(a0, R), [x1, y1] = p(a1, R), [xm, ym] = p((a0 + a1) / 2, R + 22);
    out += `<path d="M200 338L${f1(x0)} ${f1(y0)}Q${f1(xm)} ${f1(ym)} ${f1(x1)} ${f1(y1)}Z" fill="${tonos[i]}" stroke="${tone(color, 0.85)}" stroke-opacity=".35" stroke-width=".8"/>`;
  }
  return `<g filter="url(#${c.p}-soft)">${out}</g>`;
}

function papelDelante(c: Ctx, color: string, kraft: boolean) {
  const a = kraft ? "#d8b688" : color;
  const b = kraft ? "#c7a171" : tone(color, isLight(color) ? 0.9 : 0.86);
  const linea = tone(a, 0.75);
  return `
    <path d="M78 226C118 250 176 266 238 252L221 343L200 432L180 343Z" fill="url(#${c.p}-wrapA)" stroke="${linea}" stroke-opacity=".4" stroke-width=".8"/>
    <path d="M322 226C282 250 224 266 162 252L180 343L200 432L221 343Z" fill="url(#${c.p}-wrapB)" stroke="${linea}" stroke-opacity=".4" stroke-width=".8"/>
    <path d="M120 246L190 410M280 246L210 410" stroke="${linea}" stroke-opacity=".22" stroke-width="1" fill="none"/>
    <defs>
      <linearGradient id="${c.p}-wrapA" x1="0" x2="1"><stop offset="0" stop-color="${tone(a, 1.12)}"/><stop offset=".6" stop-color="${a}"/><stop offset="1" stop-color="${tone(a, 0.88)}"/></linearGradient>
      <linearGradient id="${c.p}-wrapB" x1="1" x2="0"><stop offset="0" stop-color="${tone(b, 1.04)}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${tone(b, 0.84)}"/></linearGradient>
    </defs>`;
}

function lazo(c: Ctx, y: number) {
  return `<g>
    <path d="M178 ${y - 6}Q200 ${y + 4} 222 ${y - 6}L221 ${y + 8}Q200 ${y + 17} 179 ${y + 8}Z" fill="url(#${c.p}-satin)"/>
    <path d="M198 ${y + 6}L178 ${y + 64}L188 ${y + 60}L193 ${y + 70}L204 ${y + 8}Z" fill="url(#${c.p}-satin)"/>
    <path d="M202 ${y + 6}L222 ${y + 60}L212 ${y + 57}L208 ${y + 67}L196 ${y + 8}Z" fill="url(#${c.p}-satinD)"/>
    <path d="M200 ${y + 4}C176 ${y - 24} 146 ${y - 16} 152 ${y + 6}C158 ${y + 24} 184 ${y + 16} 200 ${y + 4}Z" fill="url(#${c.p}-satin)"/>
    <path d="M200 ${y + 4}C224 ${y - 24} 254 ${y - 16} 248 ${y + 6}C242 ${y + 24} 216 ${y + 16} 200 ${y + 4}Z" fill="url(#${c.p}-satinD)"/>
    <path d="M200 ${y + 2}C186 ${y - 12} 166 ${y - 10} 166 ${y + 2}" stroke="#fff" stroke-opacity=".35" stroke-width="1.4" fill="none"/>
    <ellipse cx="200" cy="${y + 5}" rx="9" ry="8" fill="url(#${c.p}-satin)"/>
  </g>`;
}

function cajaAtras(color: string) {
  return `<ellipse cx="200" cy="262" rx="96" ry="20" fill="${tone(color, 0.62)}"/>`;
}
function cajaDelante(c: Ctx, color: string) {
  const oro = "#c9a45c";
  return `
    <path d="M104 262V378A96 22 0 0 0 296 378V262A96 20 0 0 1 104 262Z" fill="url(#${c.p}-box)"/>
    <path d="M104 262A96 20 0 0 0 296 262" fill="none" stroke="${tone(color, 1.25)}" stroke-width="3" stroke-opacity=".7"/>
    <path d="M104 300A96 20 0 0 0 296 300" fill="none" stroke="${oro}" stroke-width="1.2" opacity=".8"/>
    <text x="200" y="345" text-anchor="middle" font-family="Bodoni Moda, Georgia, serif" font-size="26" fill="${oro}" letter-spacing="1">M&amp;S</text>
    <text x="200" y="362" text-anchor="middle" font-family="Figtree, sans-serif" font-size="7.5" letter-spacing="3" fill="${oro}">DETALLES</text>
    <defs><linearGradient id="${c.p}-box" x1="0" x2="1">
      <stop offset="0" stop-color="${tone(color, 0.7)}"/><stop offset=".3" stop-color="${tone(color, 1.08)}"/>
      <stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="${tone(color, 0.66)}"/>
    </linearGradient></defs>`;
}

function canastaAtras(c: Ctx) {
  return `<path d="M112 272C112 120 288 120 288 272" fill="none" stroke="url(#${c.p}-wick)" stroke-width="11" stroke-linecap="round"/><path d="M112 272C112 120 288 120 288 272" fill="none" stroke="#7b5528" stroke-width="11" stroke-dasharray="3 5" stroke-opacity=".35"/><ellipse cx="200" cy="272" rx="102" ry="19" fill="#6d4a22"/>`;
}
function canastaDelante(c: Ctx) {
  return `
    <path d="M98 272Q200 294 302 272L282 380Q200 402 118 380Z" fill="url(#${c.p}-weave)"/>
    <path d="M98 272Q200 294 302 272L282 380Q200 402 118 380Z" fill="url(#${c.p}-shadeH)"/>
    <path d="M96 272Q200 296 304 272" fill="none" stroke="#a4773f" stroke-width="10" stroke-linecap="round"/>
    <path d="M96 272Q200 296 304 272" fill="none" stroke="#7b5528" stroke-width="10" stroke-dasharray="4 4" stroke-opacity=".45"/>`;
}

// ------------------------------------------------------------
//  Detalles
// ------------------------------------------------------------
function detallesSvg(c: Ctx, d: string[]) {
  let out = "";
  if (d.includes("globo"))
    out += `<g class="ex"><path d="M330 118C322 170 300 196 262 214" fill="none" stroke="#b9a7ad" stroke-width="1"/>
      <path d="M330 116C306 96 284 78 292 56C298 40 320 40 330 56C340 40 362 40 368 56C376 78 354 96 330 116Z" fill="url(#${c.p}-foil)"/>
      <path d="M300 58C304 48 314 46 320 52" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6" fill="none"/>
      <path d="M327 116L330 122L333 116Z" fill="#8f2f4d"/></g>`;
  if (d.includes("espumante"))
    out += `<g class="ex" transform="translate(338 300)">
      <path d="M-8 -62H8V-36C8 -30 18 -24 18 -10V58C18 62 15 64 11 64H-11C-15 64 -18 62 -18 58V-10C-18 -24 -8 -30 -8 -36Z" fill="url(#${c.p}-glass)"/>
      <path d="M-9 -66H9V-40H-9Z" fill="url(#${c.p}-gold)"/>
      <rect x="-18" y="2" width="36" height="30" fill="#f2e7cf"/><rect x="-18" y="2" width="36" height="4" fill="#a63e5f"/>
      <text y="22" text-anchor="middle" font-family="Bodoni Moda, Georgia, serif" font-size="9" fill="#5b4a3a">Brut</text>
      <path d="M-12 -6V54" stroke="#fff" stroke-opacity=".22" stroke-width="3"/></g>`;
  if (d.includes("chocolates"))
    out += `<g class="ex" transform="translate(326 392)">
      <path d="M-38 -14H38L34 22H-34Z" fill="url(#${c.p}-gold)"/>
      <path d="M-38 -14H38L40 -22H-40Z" fill="#e6cb8b"/>
      ${[-24, -8, 8, 24].map((x) => `<circle cx="${x}" cy="2" r="7" fill="#5a3320"/><circle cx="${x - 2}" cy="0" r="2.4" fill="#fff" opacity=".18"/>`).join("")}
      <rect x="-6" y="-24" width="12" height="46" fill="#a63e5f" opacity=".9"/></g>`;
  if (d.includes("peluche"))
    out += `<g class="ex" transform="translate(70 360)">
      <circle cx="-17" cy="-44" r="10" fill="url(#${c.p}-fur)"/><circle cx="17" cy="-44" r="10" fill="url(#${c.p}-fur)"/>
      <circle cx="-17" cy="-44" r="5" fill="#e9caa3"/><circle cx="17" cy="-44" r="5" fill="#e9caa3"/>
      <ellipse cy="18" rx="30" ry="32" fill="url(#${c.p}-fur)"/>
      <ellipse cx="-24" cy="44" rx="12" ry="9" fill="url(#${c.p}-fur)"/><ellipse cx="24" cy="44" rx="12" ry="9" fill="url(#${c.p}-fur)"/>
      <ellipse cx="-24" cy="45" rx="6" ry="5" fill="#e9caa3"/><ellipse cx="24" cy="45" rx="6" ry="5" fill="#e9caa3"/>
      <circle cy="-26" r="25" fill="url(#${c.p}-fur)"/>
      <ellipse cy="-18" rx="11" ry="8.5" fill="#efd8b9"/><ellipse cy="-21" rx="4.2" ry="3" fill="#3a2418"/>
      <circle cx="-9" cy="-31" r="2.6" fill="#2a1a12"/><circle cx="9" cy="-31" r="2.6" fill="#2a1a12"/>
      <circle cx="-8.2" cy="-32" r=".9" fill="#fff"/><circle cx="9.8" cy="-32" r=".9" fill="#fff"/>
      <path d="M-14 2L0 -4L14 2L0 8Z" fill="#a63e5f"/><circle r="3.4" cy="2" fill="#8f2f4d"/></g>`;
  return out;
}

// ------------------------------------------------------------
//  Dibujo completo
// ------------------------------------------------------------
/** Devuelve el SVG del ramo. `p` es un prefijo para que los ids no choquen. */
export function dibujarRamo(r: Ramo, p = "rm") {
  const size = TAMANOS.find((t) => t.id === r.tamano) ?? TAMANOS[1];
  const n = size.flores <= 24 ? size.flores : 36;
  const pres = r.presentacion;
  const papel = PAPELES.find((x) => x.id === r.papel)?.hex ?? PAPELES[0].hex;
  const enRecipiente = pres === "caja" || pres === "canasta";
  const fill = Math.min(1, size.flores / 24);

  // Zona donde van las flores (elipse)
  const B: Base = enRecipiente
    ? { cx: 200, cy: 222, rx: 70 + 26 * fill, ry: 44 + 16 * fill }
    : { cx: 200, cy: 188, rx: 80 + 44 * fill, ry: 60 + 30 * fill };
  const area = Math.PI * B.rx * B.ry;
  let radio = Math.sqrt(area / (n * Math.PI)) * 1.22;

  // Degradados que se usan en este dibujo
  const grads = new Map<string, string>();
  let defs = "";
  const grad = (hex: string, garganta = false, vertical = false) => {
    const key = `${hex}${garganta ? "g" : ""}${vertical ? "v" : ""}`;
    if (grads.has(key)) return grads.get(key)!;
    const id = `${p}-g${grads.size}`;
    grads.set(key, id);
    const claro = isLight(hex);
    const tip = tone(hex, claro ? 1.02 : 1.28), mid = hex, base = tone(hex, claro ? 0.84 : 0.6);
    const s0 = garganta ? (claro ? "#dfe0a6" : tone(hex, 0.9)) : base;
    defs += vertical
      ? `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tip}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${base}"/></linearGradient>`
      : `<linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${s0}"/><stop offset=".5" stop-color="${mid}"/><stop offset="1" stop-color="${tip}"/></linearGradient>`;
    defs += `<radialGradient id="${p}-core-${id}"><stop offset="0" stop-color="${tone(hex, claro ? 0.8 : 0.5)}"/><stop offset="1" stop-color="${mid}"/></radialGradient>`;
    return id;
  };
  const ctx: Ctx = { p, grad };

  const rand = rng(11);
  // Posiciones (espiral de Vogel dentro de la elipse), de atrás hacia adelante
  const pts: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996323;
    const d = Math.sqrt((i + 0.5) / n);
    pts.push({
      x: B.cx + Math.cos(a) * B.rx * d + (rand() - 0.5) * 5,
      y: B.cy + Math.sin(a) * B.ry * d + (rand() - 0.5) * 5,
      s: 0.92 + rand() * 0.16,
    });
  }
  pts.sort((a, b) => a.y - b.y);

  const colorDe = (i: number) => {
    if (r.flor === "girasoles") return "#f3c23c";
    const c = COLORES.find((c) => c.id === r.color);
    return !c || !c.hex ? MIX[(i * 3) % MIX.length] : c.hex;
  };
  const tipoDe = (i: number) => (r.flor === "mixto" ? TIPOS_MIX[i % TIPOS_MIX.length] : r.flor);

  // Follaje alrededor y entre las flores
  let follaje = "";
  const borde = 14 + Math.round(10 * fill);
  for (let i = 0; i < borde; i++) {
    const a = Math.PI + (i / (borde - 1)) * Math.PI; // arco superior
    const x = B.cx + Math.cos(a) * B.rx * 0.96, y = B.cy + Math.sin(a) * B.ry * 0.9 + 6;
    const ang = (a * 180) / Math.PI + 90 + (rand() - 0.5) * 18;
    follaje += i % 3 === 0
      ? eucalipto(ctx, x, y, 44 + rand() * 16, ang)
      : hoja(ctx, x, y, 34 + rand() * 16, ang, i % 3 === 2);
  }
  for (let i = 0; i < Math.round(n / 3); i++) {
    const pt = pts[Math.floor(rand() * pts.length)];
    follaje += hoja(ctx, pt.x + (rand() - 0.5) * radio, pt.y, radio * 1.2, (rand() - 0.5) * 80, rand() > 0.5);
  }

  // Flores
  let flores = "";
  pts.forEach((pt, i) => {
    const tipo = tipoDe(i), hex = colorDe(i), rr = radio * pt.s, giro = rand() * 360;
    let body = "";
    if (tipo === "girasoles") body = girasol(ctx, rr, giro);
    else if (tipo === "gerberas") body = gerbera(ctx, rr, hex, giro);
    else if (tipo === "lirios") body = lirio(ctx, rr, hex, giro);
    else if (tipo === "tulipanes") body = tulipan(ctx, rr * 0.95, hex);
    else body = rosa(ctx, rr, hex, giro);
    const tilt = tipo === "tulipanes" ? ` rotate(${f1(((pt.x - B.cx) / B.rx) * 16)})` : "";
    flores += `<g transform="translate(${f1(pt.x)} ${f1(pt.y)})${tilt}"><g class="fi" style="animation-delay:${Math.min(i * 22, 600)}ms">${body}</g></g>`;
  });

  // Paniculata entre las flores (no en cajas pequeñas)
  let nube = "";
  const nNubes = Math.round(3 + n / 4);
  for (let i = 0; i < nNubes; i++) {
    const a = rand() * Math.PI * 2, d = 0.55 + rand() * 0.45;
    nube += paniculata(B.cx + Math.cos(a) * B.rx * d, B.cy + Math.sin(a) * B.ry * d - 4, rand);
  }

  // Tarjeta pinchada en el ramo
  const tarjeta = r.tarjeta
    ? `<g class="ex" transform="translate(${f1(B.cx + B.rx * 0.55)} ${f1(B.cy - B.ry * 0.95)}) rotate(9)"><path d="M0 4V64" stroke="#7a9a6a" stroke-width="1.6"/><rect x="-19" y="-24" width="38" height="28" rx="2" fill="#fffdf8" stroke="#e2d8cb" stroke-width=".8"/><text y="-8" text-anchor="middle" font-family="Bodoni Moda, Georgia, serif" font-size="8.5" fill="#a63e5f">M&amp;S</text><path d="M-11 -2H11" stroke="#d8c9c3" stroke-width=".8"/></g>`
    : "";

  // Presentación
  let atras = "", delante = "";
  if (pres === "caja") {
    atras = cajaAtras(papel);
    delante = cajaDelante(ctx, papel);
  } else if (pres === "canasta") {
    atras = canastaAtras(ctx);
    delante = canastaDelante(ctx);
  } else {
    const kraft = pres === "kraft";
    atras = papelAtras(ctx, kraft ? "#d8b688" : papel, kraft);
    delante = papelDelante(ctx, kraft ? "#d8b688" : papel, kraft) + lazo(ctx, 338);
  }

  const sombraY = enRecipiente ? 392 : 430;
  return `<svg viewBox="0 0 400 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vista previa de tu ramo">
  <defs>
    ${defs}
    <linearGradient id="${p}-leaf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3f6436"/><stop offset="1" stop-color="#7da267"/></linearGradient>
    <linearGradient id="${p}-sage" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5c7f64"/><stop offset="1" stop-color="#9dbca4"/></linearGradient>
    <radialGradient id="${p}-euca" cx=".35" cy=".35"><stop offset="0" stop-color="#b7cdbd"/><stop offset="1" stop-color="#7c9c88"/></radialGradient>
    <linearGradient id="${p}-sun" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#df9a12"/><stop offset=".5" stop-color="#f5c638"/><stop offset="1" stop-color="#fde38a"/></linearGradient>
    <radialGradient id="${p}-seed"><stop offset="0" stop-color="#2e1a0c"/><stop offset=".7" stop-color="#4f3016"/><stop offset="1" stop-color="#6e4520"/></radialGradient>
    <linearGradient id="${p}-satin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c85a7c"/><stop offset=".45" stop-color="#a63e5f"/><stop offset="1" stop-color="#7e2c47"/></linearGradient>
    <linearGradient id="${p}-satinD" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b14d6f"/><stop offset="1" stop-color="#6f2540"/></linearGradient>
    <linearGradient id="${p}-foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f38fae"/><stop offset=".5" stop-color="#d94f78"/><stop offset="1" stop-color="#a63e5f"/></linearGradient>
    <linearGradient id="${p}-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a7823e"/><stop offset=".5" stop-color="#e8cf8f"/><stop offset="1" stop-color="#a7823e"/></linearGradient>
    <linearGradient id="${p}-glass" x1="0" x2="1"><stop offset="0" stop-color="#1d3322"/><stop offset=".4" stop-color="#3c6146"/><stop offset="1" stop-color="#1a2c1e"/></linearGradient>
    <radialGradient id="${p}-fur" cx=".4" cy=".35"><stop offset="0" stop-color="#d9ac7c"/><stop offset="1" stop-color="#a87648"/></radialGradient>
    <linearGradient id="${p}-wick" x1="0" x2="1"><stop offset="0" stop-color="#8a6233"/><stop offset=".5" stop-color="#c2955a"/><stop offset="1" stop-color="#8a6233"/></linearGradient>
    <pattern id="${p}-weave" width="18" height="12" patternUnits="userSpaceOnUse">
      <rect width="18" height="12" fill="#a9793f"/>
      <ellipse cx="4.5" cy="3" rx="5" ry="2.6" fill="#c99a5e"/><ellipse cx="13.5" cy="9" rx="5" ry="2.6" fill="#c99a5e"/>
      <ellipse cx="13.5" cy="3" rx="5" ry="2.6" fill="#b4834a"/><ellipse cx="4.5" cy="9" rx="5" ry="2.6" fill="#b4834a"/>
    </pattern>
    <linearGradient id="${p}-shadeH" x1="0" x2="1"><stop offset="0" stop-color="#3a220c" stop-opacity=".45"/><stop offset=".35" stop-color="#3a220c" stop-opacity="0"/><stop offset=".7" stop-color="#3a220c" stop-opacity=".05"/><stop offset="1" stop-color="#3a220c" stop-opacity=".5"/></linearGradient>
    <filter id="${p}-shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.2" stdDeviation="2.2" flood-color="#3b1a26" flood-opacity=".22"/></filter>
    <filter id="${p}-soft"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#3b1a26" flood-opacity=".12"/></filter>
    <filter id="${p}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
  </defs>
  <ellipse cx="200" cy="${sombraY}" rx="${enRecipiente ? 112 : 70}" ry="12" fill="#3b1a26" opacity=".18" filter="url(#${p}-blur)"/>
  ${atras}
  <g filter="url(#${p}-soft)">${follaje}</g>
  ${tarjeta}
  <g filter="url(#${p}-shadow)">${flores}</g>
  <g>${nube}</g>
  ${delante}
  ${detallesSvg(ctx, r.detalles)}
</svg>`;
}

/** Mensaje de WhatsApp con el resumen del ramo. */
export function mensajeRamo(r: Ramo, extra: { para?: string; tarjeta?: string; fecha?: string; distrito?: string; precio?: number | null }) {
  const f = FLORES.find((x) => x.id === r.flor)?.label ?? "";
  const c = r.flor === "girasoles" ? "" : ` (${COLORES.find((x) => x.id === r.color)?.label ?? ""})`;
  const t = TAMANOS.find((x) => x.id === r.tamano);
  const pr = PRESENTACIONES.find((x) => x.id === r.presentacion);
  const papel = pr?.conColor ? ` ${PAPELES.find((x) => x.id === r.papel)?.label.toLowerCase() ?? ""}` : "";
  const d = r.detalles.map((id) => DETALLES.find((x) => x.id === id)?.label).filter(Boolean).join(", ");
  return [
    "¡Hola M&S Detalles! 🌸 Armé este ramo en la web:",
    `• Flores: ${f}${c}`,
    `• Tamaño: ${t?.label} (${t?.detalle})`,
    `• Presentación: ${pr?.label ?? ""}${papel}`,
    d && `• Detalles: ${d}`,
    extra.para && `• Para: ${extra.para}`,
    extra.tarjeta && `• Tarjeta: "${extra.tarjeta}"`,
    extra.fecha && `• Fecha de entrega: ${extra.fecha}`,
    extra.distrito && (extra.distrito === "Recojo en tienda" ? "• Lo recojo en la tienda" : `• Distrito: ${extra.distrito}`),
    extra.precio ? `• Precio estimado en la web: S/ ${extra.precio}` : "",
    extra.precio ? "¿Me confirman la disponibilidad?" : "¿Me ayudan con el precio y la disponibilidad?",
  ]
    .filter(Boolean)
    .join("\n");
}
