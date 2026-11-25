// ============================================================
//  Datos generales de Florería M&S Detalles — edita aquí y se actualiza
//  en toda la web.
// ============================================================
export const site = {
  nombre: "M&S Detalles",
  // Número de WhatsApp con código de país, sin "+" ni espacios.
  whatsapp: "51959159422",
  whatsappMensaje: "¡Hola M&S Detalles! 🌸 Quisiera información para hacer un pedido.",
  celular: "959 159 422",
  correo: "floreriamysdetalles@gmail.com",
  direccion: "Av. Metropolitana 407, San Martín de Comas 15314",
  // Datos legales para el Libro de Reclamaciones (completar con los datos de SUNAT)
  razonSocial: "",
  ruc: "",
  horario: "Lun a Dom: 7:30 a.m. – 11:30 p.m.",
  redes: {
    instagram: "https://www.instagram.com/floreria_mys_detalles/",
    facebook: "https://www.facebook.com/profile.php?id=61596155381669",
    tiktok: "https://www.tiktok.com/@mys_floreria",
  },
};

// Abre Google Maps con la ruta hasta la tienda
export const mapsDir = () =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.direccion + ", Lima, Perú")}`;
export const mapsEmbed = () =>
  `https://www.google.com/maps?q=${encodeURIComponent(site.direccion + ", Lima, Perú")}&output=embed`;

export const waLink = (msg?: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(msg || site.whatsappMensaje)}`;

export const unsplash = (id: string, w = 600, h = w) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=75`;
