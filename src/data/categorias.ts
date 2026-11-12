// ============================================================
//  Categorías de arreglos (sección "¿Qué tipo de arreglos tenemos?").
//  `nombre` debe ser IGUAL al nombre de la categoría en uTracker.
//  Si creas una categoría nueva en uTracker y no está aquí,
//  la web la muestra igual, con la foto de uno de sus productos.
// ============================================================
import ramos from "../assets/galeria/7.jpg";
import box from "../assets/galeria/9.jpg";
import condolencias from "../assets/galeria/1.jpg";
import ocasion from "../assets/galeria/5.jpg";
import eventos from "../assets/galeria/11.jpg";

const u = (id: string) => `https://images.unsplash.com/${id}?w=700&h=560&fit=crop&auto=format&q=75`;

export interface Categoria {
  nombre: string;
  descripcion: string;
  /** Foto local (de src/assets) o URL. */
  imagen: ImageMetadata | string;
}

/** En este orden se muestran. */
export const categorias: Categoria[] = [
  { nombre: "Ramos de flores", descripcion: "Rosas, girasoles y más, envueltos y listos para regalar.", imagen: ramos },
  { nombre: "Box florales", descripcion: "Flores en caja: elegantes y perfectas para sorprender.", imagen: box },
  { nombre: "Canastas y arreglos", descripcion: "Arreglos en canasta o base, para la mesa o para regalar.", imagen: u("photo-1591886960571-74d43a9d4166") },
  { nombre: "Flores eternas", descripcion: "Flores preservadas que conservan su belleza por mucho tiempo.", imagen: u("photo-1767986012134-5a93f8428d56") },
  { nombre: "Flores y regalos", descripcion: "Flores acompañadas de un detalle especial para regalar.", imagen: u("photo-1549465220-1a8b9238cd48") },
  { nombre: "Por ocasión", descripcion: "Cumpleaños, aniversarios, amor, agradecimiento y más.", imagen: ocasion },
  { nombre: "Eventos y ocasiones especiales", descripcion: "Arreglos para celebraciones, graduaciones y eventos.", imagen: eventos },
  { nombre: "Condolencias", descripcion: "Arreglos y coronas para acompañar con respeto.", imagen: condolencias },
];

export const catUrl = (nombre: string) => `/tienda?cat=${encodeURIComponent(nombre)}`;
