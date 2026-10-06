// ============================================================
//  Datos generales de Florería M&S Detalles — edita aquí y se actualiza
//  en toda la web.
// ============================================================
export const site = {
  nombre: "M&S Detalles",
  // Número de WhatsApp con código de país, sin "+" ni espacios.
  whatsapp: "51999999999",
  whatsappMensaje: "¡Hola M&S Detalles! 🌸 Quisiera información para hacer un pedido.",
  telefono: "(01) 999 9999",
  celular: "999 999 999",
  correo: "hola@mysfloreria.pe",
  direccion: "Av. Ejemplo 123, Miraflores, Lima",
  horario: "Lun a Sáb: 8:00 a.m. – 8:00 p.m. · Dom: 9:00 a.m. – 2:00 p.m.",
  redes: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "https://tiktok.com/",
  },
};

export const waLink = (msg?: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(msg || site.whatsappMensaje)}`;

export const unsplash = (id: string, w = 600, h = w) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop`;
