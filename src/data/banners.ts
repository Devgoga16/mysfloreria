// ============================================================
//  Banners del inicio. Edita textos, enlaces y fotos aquí.
//  Las fotos se toman de src/assets/galeria/ (tus fotos reales).
// ============================================================
import { waLink } from "./site";
import foto1 from "../assets/galeria/1.jpg";
import foto5 from "../assets/galeria/5.jpg";
import foto7 from "../assets/galeria/7.jpg";
import foto9 from "../assets/galeria/9.jpg";
import foto11 from "../assets/galeria/11.jpg";

export interface Slide {
  eyebrow: string;
  /** Usa *texto* para la parte en cursiva oro rosa. */
  title: string;
  text: string;
  cta: string;
  href: string;
  image: ImageMetadata;
  /** "plum" = fondo ciruela, "blush" = fondo rosado claro */
  tone: "plum" | "blush";
  external?: boolean;
}

/** Carrusel principal (rota solo cada 6 segundos). */
export const slides: Slide[] = [
  {
    eyebrow: "Temporada navideña",
    title: "Esta Navidad, *regala flores*",
    text: "Arreglos hechos a mano para compartir en familia o sorprender a alguien especial. Programa tu entrega con anticipación.",
    cta: "Ver arreglos",
    href: "/tienda",
    image: foto9,
    tone: "plum",
  },
  {
    eyebrow: "Para enamorar",
    title: "Ramos que *dicen te quiero*",
    text: "Rosas y flores de temporada en diseños que no se olvidan.",
    cta: "Ver ramos de amor",
    href: "/tienda?ocasion=Amor",
    image: foto7,
    tone: "blush",
  },
  {
    eyebrow: "Pedido personalizado",
    title: "Diseñado *a tu medida*",
    text: "Cuéntanos la ocasión, los colores y tu presupuesto. Armamos el arreglo contigo.",
    cta: "Escríbenos por WhatsApp",
    href: waLink("¡Hola! Quisiera diseñar un arreglo personalizado 🌷"),
    image: foto11,
    tone: "plum",
    external: true,
  },
];

/** Banners grandes por categoría (debajo de "Compra por ocasión"). */
export const categoryBanners = [
  {
    eyebrow: "Condolencias",
    title: "Arreglos para *despedir con amor*",
    text: "Coronas y arreglos fúnebres con entrega en Lima.",
    cta: "Ver arreglos",
    href: "/tienda?ocasion=Condolencias",
    image: foto1,
  },
  {
    eyebrow: "Cumpleaños",
    title: "Celebra su día *con flores*",
    text: "Ramos alegres y llenos de color para sorprender.",
    cta: "Ver arreglos",
    href: "/tienda?ocasion=Cumplea%C3%B1os",
    image: foto5,
  },
];

/** Convierte *texto* en <em>texto</em> (para los títulos). */
export const withEm = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!).replace(/\*(.+?)\*/g, "<em>$1</em>");
