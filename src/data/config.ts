// Datos de la tienda: editá acá y se actualiza en todo el sitio.
export const STORE = {
  name: "Tesoria",
  // Número de WhatsApp con código de país, sin + ni espacios. Ej: "5491122334455".
  // Si está vacío, WhatsApp deja elegir a quién enviar el mensaje.
  whatsappNumber: "",
  // URL completa de Instagram (ej: "https://instagram.com/tesoria"). Vacío = no se muestra.
  instagramUrl: "",
  freeShippingFrom: 50000,
  cashDiscount: 0.15, // 15% OFF en efectivo
  hours: "Lunes a viernes, de 10:00 a 20:00",
};

export function whatsappLink(message: string) {
  const base = STORE.whatsappNumber
    ? `https://wa.me/${STORE.whatsappNumber}`
    : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
