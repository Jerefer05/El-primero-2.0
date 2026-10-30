// Dirección pública de la tienda, para Google y para las vistas previas de
// links. Cuando haya dominio propio, se carga en Vercel como
// NEXT_PUBLIC_SITE_URL (ej: https://tesoria.com.ar). Mientras tanto se usa la
// dirección de Vercel, que Vercel completa solo.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");
