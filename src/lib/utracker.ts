// Cliente de la API de tienda de uTracker (ver INTEGRACION-TIENDA.md).
// La llave es publicable: puede vivir en el navegador.
import { demoConfig, demoProducts, demoCampaigns } from "./demo";

const API = import.meta.env.PUBLIC_UTRACKER_API || "https://utracker-api.unify-tc.com/api";
const KEY = import.meta.env.PUBLIC_UTRACKER_KEY || "";

/** Sin llave configurada la web funciona con productos de ejemplo. */
export const DEMO = !KEY;

export interface Variant { name: string; priceModifier: number; price: number }
export interface Product {
  id: string;
  kind: string;
  name: string;
  description: string;
  price: number;
  pricingMode: "fixed" | "quoted";
  images: string[];
  category: string;
  variants: Variant[];
  attributes: { filter: string; values: string[] }[];
  inStock: boolean;
  stock: number | null;
  preparationDays: number;
  requiresAdvance: boolean;
  advanceType?: "percent" | "fixed";
  advanceValue?: number;
}
export interface StoreConfig {
  store: {
    name: string;
    slug: string;
    logoUrl?: string;
    brandColor?: string;
    phone?: string;
    schedule: { day: number; open: string; close: string }[];
    deliveryTypes: string[];
    deliveryFranjas: string[];
    acceptsOnlineOrders: boolean;
  };
  filters: { id: string; name: string; values: string[] }[];
  checkoutBaseUrl: string;
}
export interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  url: string;
  items: { name: string; price: number; imageUrl: string; available: number }[];
}
export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
  totalAmount: number;
  advanceDue: number;
  expiresAt: string;
}

export class UtrackerError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function utracker<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}/storefront${path}`, {
      ...options,
      headers: {
        "X-Store-Key": KEY,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new UtrackerError("No pudimos conectar con la tienda. Revisa tu conexión e inténtalo de nuevo.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new UtrackerError(data.message ?? "Ocurrió un error inesperado.", res.status);
  return data as T;
}

// Una sola carga por página, compartida entre componentes.
let configP: Promise<StoreConfig> | null = null;
let productsP: Promise<{ products: Product[]; categories: string[] }> | null = null;

export function getConfig() {
  configP ??= DEMO ? Promise.resolve(demoConfig) : utracker<StoreConfig>("/config");
  return configP;
}

export function getProducts(fresh = false) {
  if (fresh) productsP = null;
  productsP ??= DEMO
    ? Promise.resolve({ products: demoProducts, categories: [...new Set(demoProducts.map((p) => p.category))] })
    : utracker("/products");
  return productsP;
}

export async function getCampaigns(): Promise<Campaign[]> {
  if (DEMO) return demoCampaigns;
  return (await utracker<{ campaigns: Campaign[] }>("/campaigns")).campaigns;
}

export async function createCheckout(
  items: { productId: string; quantity: number; variant?: string }[],
): Promise<CheckoutSession> {
  if (DEMO) {
    throw new UtrackerError(
      "Modo demostración: configura PUBLIC_UTRACKER_KEY para habilitar los pagos.",
      400,
    );
  }
  return utracker<CheckoutSession>("/checkout", {
    method: "POST",
    body: JSON.stringify({ items, returnUrl: `${window.location.origin}/gracias` }),
  });
}

// ---------- Ayudas de presentación ----------
export const soles = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const minPrice = (p: Product) =>
  p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : p.price;

export const priceLabel = (p: Product) => {
  const base = soles(minPrice(p));
  if (p.pricingMode === "quoted") return `Referencial ${base}`;
  return p.variants.length > 1 ? `Desde ${base}` : base;
};

export const prepLabel = (days: number) =>
  days <= 0 ? "" : days === 1 ? "Listo en 1 día" : `Listo en ${days} días`;
