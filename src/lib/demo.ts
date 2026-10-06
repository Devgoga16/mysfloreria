// Datos de ejemplo con la misma forma que la API de uTracker.
// Se usan solo cuando no hay PUBLIC_UTRACKER_KEY configurada.
import type { Product, StoreConfig, Campaign } from "./utracker";

const img = (id: string) => `https://images.unsplash.com/${id}?w=800&h=800&fit=crop`;

export const demoConfig: StoreConfig = {
  store: {
    name: "M&S Detalles",
    slug: "m-s-detalles",
    phone: "51999999999",
    schedule: [1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "08:00", close: "20:00" })),
    deliveryTypes: ["pickup", "delivery_own"],
    deliveryFranjas: ["morning", "afternoon"],
    acceptsOnlineOrders: true,
  },
  filters: [
    { id: "f-color", name: "Color", values: ["Rojo", "Rosado", "Blanco", "Amarillo", "Mixto"] },
    { id: "f-ocasion", name: "Ocasión", values: ["Amor", "Cumpleaños", "Agradecimiento", "Condolencias"] },
  ],
  checkoutBaseUrl: "https://utracker.unify-tc.com/checkout",
};

const base = {
  kind: "product",
  pricingMode: "fixed" as const,
  variants: [],
  inStock: true,
  stock: null,
  preparationDays: 0,
  requiresAdvance: true,
  advanceType: "percent" as const,
  advanceValue: 50,
};

export const demoProducts: Product[] = [
  {
    ...base, id: "demo-1", name: "Dulce Rubor", category: "Ramos",
    description: "Rosas y peonías en tonos pastel, envueltas en papel kraft.",
    price: 129, images: [img("photo-1563241527-3004b7be0ffd")],
    variants: [
      { name: "Mediano", priceModifier: 0, price: 129 },
      { name: "Grande", priceModifier: 50, price: 179 },
    ],
    attributes: [{ filter: "f-color", values: ["Rosado"] }, { filter: "f-ocasion", values: ["Amor", "Cumpleaños"] }],
  },
  {
    ...base, id: "demo-2", name: "Tulipanes Primavera", category: "Tulipanes",
    description: "12 tulipanes frescos en jarrón de vidrio.",
    price: 149, images: [img("photo-1561181286-d3fee7d55364")], stock: 3,
    attributes: [{ filter: "f-color", values: ["Rosado"] }, { filter: "f-ocasion", values: ["Cumpleaños", "Agradecimiento"] }],
  },
  {
    ...base, id: "demo-3", name: "Jardín de Rosas", category: "Rosas",
    description: "Rosas mixtas en florero de vidrio.",
    price: 169, images: [img("photo-1591886960571-74d43a9d4166")],
    attributes: [{ filter: "f-color", values: ["Mixto"] }, { filter: "f-ocasion", values: ["Amor"] }],
  },
  {
    ...base, id: "demo-4", name: "Pasión Silvestre", category: "Arreglos",
    description: "Arreglo de temporada con proteas y rosas.",
    price: 189, images: [img("photo-1457089328109-e5d9bd499191")], preparationDays: 2,
    attributes: [{ filter: "f-color", values: ["Rojo", "Mixto"] }, { filter: "f-ocasion", values: ["Amor"] }],
  },
  {
    ...base, id: "demo-5", name: "Rosas Rojas Clásicas", category: "Rosas",
    description: "Rosas rojas premium. Elige la cantidad.",
    price: 119, images: [img("photo-1494972308805-463bc619d34e")],
    variants: [
      { name: "12 rosas", priceModifier: 0, price: 119 },
      { name: "24 rosas", priceModifier: 100, price: 219 },
      { name: "50 rosas", priceModifier: 330, price: 449 },
    ],
    attributes: [{ filter: "f-color", values: ["Rojo"] }, { filter: "f-ocasion", values: ["Amor"] }],
  },
  {
    ...base, id: "demo-6", name: "Ramo del Campo", category: "Girasoles",
    description: "Girasoles y flores silvestres en papel kraft.",
    price: 99, images: [img("photo-1567696153798-9111f9cd3d0d")],
    attributes: [{ filter: "f-color", values: ["Amarillo"] }, { filter: "f-ocasion", values: ["Cumpleaños", "Agradecimiento"] }],
  },
  {
    ...base, id: "demo-7", name: "Nube Rosada", category: "Ramos",
    description: "Peonías importadas. Agotadas por temporada.",
    price: 239, images: [img("photo-1582794543139-8ac9cb0f7b11")], inStock: false, stock: 0,
    attributes: [{ filter: "f-color", values: ["Rosado"] }, { filter: "f-ocasion", values: ["Amor"] }],
  },
  {
    ...base, id: "demo-8", name: "Corona de Paz", category: "Arreglos",
    description: "Arreglo fúnebre a pedido. El precio final se coordina según el diseño.",
    price: 350, pricingMode: "quoted", images: [img("photo-1525310072745-f49212b5ac6d")], preparationDays: 1,
    attributes: [{ filter: "f-color", values: ["Blanco"] }, { filter: "f-ocasion", values: ["Condolencias"] }],
  },
];

export const demoCampaigns: Campaign[] = [];
