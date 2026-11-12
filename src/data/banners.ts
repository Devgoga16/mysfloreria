// ============================================================
//  Portadas del inicio. Edita imágenes, textos alternativos y enlaces aquí.
// ============================================================
import portadaGraduacion from "../assets/portada/portada.png";
import portadaServicios from "../assets/portada/portada-2-servicios.png";
import portadaFunebres from "../assets/portada/portada-3-funebres.png";

/**
 * Portadas: el carrusel con el que abre el inicio (rotan cada 6 s).
 * Imágenes de 2048 × 768 px en src/assets/portada/. En celular se recortan
 * al centro (4:3), así que el texto debe ir en la zona central.
 * Para agregar, quitar o reordenar portadas, edita esta lista.
 * Las fuentes editables de las portadas 2 y 3 están en brand/portadas-fuente/.
 */
export const portadas = [
  {
    image: portadaGraduacion,
    // alt: describe lo que dice la imagen, para Google y lectores de pantalla
    alt: "Florería M&S Detalles. Cada detalle dice lo que sientes. Inicio de campaña Graduación: celebra este gran logro con flores y hazlo aún más especial.",
    href: "/tienda?cat=Eventos%20y%20ocasiones%20especiales",
    // texto del botón que aparece debajo de la portada
    cta: "Arreglos de graduación",
  },
  {
    image: portadaServicios,
    alt: "Florería M&S Detalles. Nuestros servicios: para cada momento. Ramos, arreglos florales y detalles para regalar. Delivery en Lima, pago con Yape y Plin.",
    href: "/tienda",
    cta: "Ver todos los arreglos",
  },
  {
    image: portadaFunebres,
    alt: "Florería M&S Detalles. Condolencias: arreglos fúnebres. Acompañamos tus momentos difíciles con respeto y elegancia. Coronas y arreglos, entrega en Lima.",
    href: "/tienda?cat=Condolencias",
    cta: "Arreglos de condolencias",
  },
];
