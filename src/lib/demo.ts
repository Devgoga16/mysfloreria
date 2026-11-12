// Datos de ejemplo con la misma forma que la API de uTracker.
// Se usan solo cuando no hay PUBLIC_UTRACKER_KEY configurada.
import type { Product, StoreConfig, Campaign } from "./utracker";

const img = (id: string) => `https://images.unsplash.com/${id}?w=900&h=1125&fit=crop&auto=format&q=75`;

export const demoConfig: StoreConfig = {
  store: {
    name: "M&S Detalles",
    slug: "m-s-detalles",
    phone: "51959159422",
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
    ...base, id: "demo-1", name: "Dulce Rubor", category: "Ramos de flores",
    description: "Rosas y peonías en tonos pastel, envueltas en papel kraft.",
    price: 129, images: [img("photo-1563241527-3004b7be0ffd"), img("photo-1591886960571-74d43a9d4166"), img("photo-1582794543139-8ac9cb0f7b11")],
    variants: [
      { name: "Mediano", priceModifier: 0, price: 129 },
      { name: "Grande", priceModifier: 50, price: 179 },
    ],
    attributes: [{ filter: "f-color", values: ["Rosado"] }, { filter: "f-ocasion", values: ["Amor", "Cumpleaños"] }],
  },
  {
    ...base, id: "demo-2", name: "Tulipanes Primavera", category: "Ramos de flores",
    description: "12 tulipanes frescos en jarrón de vidrio.",
    price: 149, images: [img("photo-1561181286-d3fee7d55364")], stock: 3,
    attributes: [{ filter: "f-color", values: ["Rosado"] }, { filter: "f-ocasion", values: ["Cumpleaños", "Agradecimiento"] }],
  },
  {
    ...base, id: "demo-3", name: "Jardín de Rosas", category: "Canastas y arreglos",
    description: "Rosas mixtas en florero de vidrio.",
    price: 169, images: [img("photo-1591886960571-74d43a9d4166")],
    attributes: [{ filter: "f-color", values: ["Mixto"] }, { filter: "f-ocasion", values: ["Amor"] }],
  },
  {
    ...base, id: "demo-4", name: "Pasión Silvestre", category: "Canastas y arreglos",
    description: "Arreglo de temporada con proteas y rosas.",
    price: 189, images: [img("photo-1457089328109-e5d9bd499191")], preparationDays: 2,
    attributes: [{ filter: "f-color", values: ["Rojo", "Mixto"] }, { filter: "f-ocasion", values: ["Amor"] }],
  },
  {
    ...base, id: "demo-5", name: "Rosas Rojas Clásicas", category: "Ramos de flores",
    description: "Rosas rojas premium. Elige la cantidad.",
    price: 119, images: [img("photo-1494972308805-463bc619d34e"), img("photo-1519378058457-4c29a0a2efac")],
    variants: [
      { name: "12 rosas", priceModifier: 0, price: 119 },
      { name: "24 rosas", priceModifier: 100, price: 219 },
      { name: "50 rosas", priceModifier: 330, price: 449 },
    ],
    attributes: [{ filter: "f-color", values: ["Rojo"] }, { filter: "f-ocasion", values: ["Amor"] }],
  },
  {
    ...base, id: "demo-6", name: "Ramo del Campo", category: "Ramos de flores",
    description: "Girasoles y flores silvestres en papel kraft.",
    price: 99, images: [img("photo-1567696153798-9111f9cd3d0d")],
    attributes: [{ filter: "f-color", values: ["Amarillo"] }, { filter: "f-ocasion", values: ["Cumpleaños", "Agradecimiento"] }],
  },
  {
    ...base, id: "demo-7", name: "Nube Rosada", category: "Box florales",
    description: "Peonías importadas. Agotadas por temporada.",
    price: 239, images: [img("photo-1582794543139-8ac9cb0f7b11")], inStock: false, stock: 0,
    attributes: [{ filter: "f-color", values: ["Rosado"] }, { filter: "f-ocasion", values: ["Amor"] }],
  },
  {
    ...base, id: "demo-8", name: "Corona de Paz", category: "Condolencias",
    description: "Arreglo fúnebre a pedido. El precio final se coordina según el diseño.",
    price: 350, pricingMode: "quoted", images: [img("photo-1525310072745-f49212b5ac6d")], preparationDays: 1,
    attributes: [{ filter: "f-color", values: ["Blanco"] }, { filter: "f-ocasion", values: ["Condolencias"] }],
  },
  ...[
    { id: "demo-9", name: "Corazón de Flores", category: "Eventos y ocasiones especiales", price: 199, image: "photo-1526047932273-341f2a7631f9", desc: "Arreglo en forma de corazón con rosas y flores de colores.", ocasion: ["Amor"], color: ["Mixto"] },
    { id: "demo-10", name: "Girasol Radiante", category: "Por ocasión", price: 89, image: "photo-1470509037663-253afd7f0f51", desc: "Girasoles frescos que alegran cualquier día.", ocasion: ["Cumpleaños", "Agradecimiento"], color: ["Amarillo"] },
    { id: "demo-11", name: "Campo de Girasoles", category: "Ramos de flores", price: 139, image: "photo-1455659817273-f96807779a8a", desc: "Ramo abundante de girasoles.", ocasion: ["Cumpleaños"], color: ["Amarillo"] },
    { id: "demo-12", name: "Margaritas Blancas", category: "Condolencias", price: 79, image: "photo-1606041008023-472dfb5e530f", desc: "Ramo sencillo y luminoso de margaritas.", ocasion: ["Agradecimiento", "Condolencias"], color: ["Blanco"] },
    { id: "demo-13", name: "Tulipanes Bicolor", category: "Box florales", price: 169, image: "photo-1468327768560-75b778cbb551", desc: "Tulipanes blancos y fucsia en ramo.", ocasion: ["Amor", "Cumpleaños"], color: ["Rosado"] },
    { id: "demo-14", name: "Pasión Roja", category: "Flores y regalos", price: 149, image: "photo-1519378058457-4c29a0a2efac", desc: "Flores rojas intensas para una declaración de amor.", ocasion: ["Amor"], color: ["Rojo"] },
  ].map((d): Product => ({
    ...base, id: d.id, name: d.name, category: d.category, description: d.desc, price: d.price, images: [img(d.image)],
    attributes: [{ filter: "f-color", values: d.color }, { filter: "f-ocasion", values: d.ocasion }],
  })),
  {
    ...base, id: "demo-15", name: "Rosas Eternas en Cúpula", category: "Flores eternas",
    description: "Rosas preservadas en cúpula de vidrio. Conservan su belleza por mucho tiempo.",
    price: 159, images: [img("photo-1767986012134-5a93f8428d56")],
    attributes: [{ filter: "f-color", values: ["Blanco"] }, { filter: "f-ocasion", values: ["Amor", "Agradecimiento"] }],
  },
  // Complementos: en uTracker basta con crear la categoría "Complementos".
  ...[
    { id: "demo-c1", name: "Bombones surtidos", description: "Caja de 12 bombones para acompañar tu arreglo.", price: 35, image: "photo-1481391319762-47dff72954d9" },
    { id: "demo-c2", name: "Peluche osito", description: "Osito de peluche de 25 cm.", price: 45, image: "photo-1559454403-b8fb88521f11" },
    { id: "demo-c3", name: "Globos de colores", description: "Set de 6 globos inflados con helio.", price: 30, image: "photo-1530103862676-de8c9debad1d" },
    { id: "demo-c4", name: "Caja de regalo", description: "Caja decorada con lazo para presentar tu detalle.", price: 25, image: "photo-1549465220-1a8b9238cd48" },
    { id: "demo-c5", name: "Espumante", description: "Botella de espumante de 750 ml.", price: 59, image: "photo-1547595628-c61a29f496f0" },
  ].map((c): Product => ({
    ...base, id: c.id, name: c.name, category: "Complementos", description: c.description,
    price: c.price, images: [img(c.image)], requiresAdvance: false, attributes: [],
  })),
];

export const demoCampaigns: Campaign[] = [];
