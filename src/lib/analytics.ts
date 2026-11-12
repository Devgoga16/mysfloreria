// ============================================================
//  Medición: Google Analytics 4 + conversiones de Google Ads.
//  No hace nada hasta que se configuren los códigos en el hosting
//  (variables de entorno PUBLIC_GA4_ID y PUBLIC_GADS_*). Ver .env.example.
// ============================================================
import type { Product } from "./utracker";

const GADS_ID = import.meta.env.PUBLIC_GADS_ID || "";
const LABELS = {
  purchase: import.meta.env.PUBLIC_GADS_LABEL_PURCHASE || "",
  lead: import.meta.env.PUBLIC_GADS_LABEL_LEAD || "",
  checkout: import.meta.env.PUBLIC_GADS_LABEL_CHECKOUT || "",
};
const CURRENCY = "PEN";

type Gtag = (...args: unknown[]) => void;
const gtag = (): Gtag | null =>
  typeof window !== "undefined" && typeof (window as unknown as { gtag?: Gtag }).gtag === "function"
    ? (window as unknown as { gtag: Gtag }).gtag
    : null;

/** Envía un evento a GA4 (y a cualquier destino configurado en la etiqueta de Google). */
export function track(event: string, params: Record<string, unknown> = {}) {
  gtag()?.("event", event, params);
}

/** Conversión directa de Google Ads (si se configuró su etiqueta). */
function adsConversion(label: string, params: Record<string, unknown> = {}) {
  if (!GADS_ID || !label) return;
  gtag()?.("event", "conversion", { send_to: `${GADS_ID}/${label}`, ...params });
}

export const toItem = (p: Pick<Product, "id" | "name" | "category" | "price">, variant?: string, price?: number, quantity = 1) => ({
  item_id: p.id,
  item_name: p.name,
  item_category: p.category,
  ...(variant ? { item_variant: variant } : {}),
  price: price ?? p.price,
  quantity,
});

// ---------- Eventos de la tienda ----------
export function trackViewItem(p: Product) {
  track("view_item", { currency: CURRENCY, value: p.price, items: [toItem(p)] });
}

export function trackAddToCart(p: Product, variant: string | undefined, price: number, quantity: number) {
  track("add_to_cart", { currency: CURRENCY, value: price * quantity, items: [toItem(p, variant, price, quantity)] });
}

export function trackSearch(term: string) {
  if (term) track("search", { search_term: term });
}

type Line = { productId: string; name: string; variant?: string; unitPrice: number; quantity: number };
const lineItems = (lines: Line[]) =>
  lines.map((l) => ({
    item_id: l.productId,
    item_name: l.name,
    ...(l.variant ? { item_variant: l.variant } : {}),
    price: l.unitPrice,
    quantity: l.quantity,
  }));

const PENDING = "mys-checkout";

/** Al crear la sesión de pago. Se guarda para registrar la compra en /gracias. */
export function trackBeginCheckout(sessionId: string, total: number, lines: Line[]) {
  const items = lineItems(lines);
  track("begin_checkout", { currency: CURRENCY, value: total, items });
  adsConversion(LABELS.checkout, { value: total, currency: CURRENCY });
  try {
    sessionStorage.setItem(PENDING, JSON.stringify({ id: sessionId, value: total, items }));
  } catch {}
}

/**
 * Compra completada: se llama en /gracias. Usa la sesión guardada al iniciar el pago,
 * así se registra una sola vez aunque se llegue por ventana o por redirección.
 */
export function trackPurchaseFromPending() {
  let data: { id: string; value: number; items: unknown[] } | null = null;
  try {
    data = JSON.parse(sessionStorage.getItem(PENDING) || "null");
    sessionStorage.removeItem(PENDING);
  } catch {}
  if (!data) return;
  track("purchase", { transaction_id: data.id, currency: CURRENCY, value: data.value, items: data.items });
  adsConversion(LABELS.purchase, { value: data.value, currency: CURRENCY, transaction_id: data.id });
}

// ---------- Contactos (WhatsApp y llamadas) ----------
/** Escucha todos los clics a WhatsApp y a teléfono de la web. */
export function initContactTracking() {
  document.addEventListener(
    "click",
    (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const method = /wa\.me|whatsapp/i.test(href) ? "whatsapp" : href.startsWith("tel:") ? "phone" : "";
      if (!method) return;
      // dónde estaba el botón: ayuda a saber qué parte de la web genera más contactos
      const where = a.closest("[id]")?.id || a.className.split(" ")[0] || "web";
      track("generate_lead", { method, link_location: where, page: location.pathname });
      adsConversion(LABELS.lead);
    },
    { capture: true },
  );
}
