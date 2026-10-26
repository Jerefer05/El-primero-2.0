// Datos fijos de la tienda. El WhatsApp, el alias, el horario e Instagram se
// editan desde el almacén (/almacen); los de acá quedan como respaldo.
export const STORE = {
  name: "Tesoria",
  // Número de WhatsApp con código de país, sin + ni espacios. Ej: "5491122334455".
  // Si está vacío, WhatsApp deja elegir a quién enviar el mensaje.
  whatsappNumber: "5492212002543",
  // URL completa de Instagram (ej: "https://instagram.com/tesoria"). Vacío = no se muestra.
  instagramUrl: "",
  freeShippingFrom: 50000,
  cashDiscount: 0.15, // 15% OFF en efectivo
  hours: "Lunes a viernes, de 10:00 a 20:00",
  // Datos para que el cliente pague por transferencia (se muestran en el comprobante).
  transfer: {
    alias: "tesoria.mp",
    cbu: "",
    holder: "", // titular de la cuenta
  },
  // Cupón que se regala en el comprobante para la próxima compra.
  nextPurchaseCoupon: {
    code: "VUELVE10",
    percent: 0.1, // 10% OFF
  },
};

export function whatsappLink(message: string, number = STORE.whatsappNumber) {
  const base = number ? `https://wa.me/${number}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
