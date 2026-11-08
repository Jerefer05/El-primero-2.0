import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const SUPABASE = "https://rcboyxkkyafhiflzbroi.supabase.co";

// Reglas de dónde puede cargar cosas la web. Por ahora va en modo "solo
// avisar" (Report-Only): el navegador anota en la consola lo que bloquearía,
// pero no rompe nada. Cuando se confirme que Analytics y el Píxel andan bien,
// se cambia la clave a "Content-Security-Policy".
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${SUPABASE} https://images.unsplash.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com`,
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE} https://api.open-meteo.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net`,
  "frame-src https://www.facebook.com https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  // Que ninguna otra página pueda mostrar la tienda (ni el almacén) dentro de un marco
  { key: "X-Frame-Options", value: "DENY" },
  // Que el navegador no adivine tipos de archivo
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Al ir a otro sitio, solo se manda el dominio, no la página exacta
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // La web no usa cámara, micrófono ni ubicación
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Fotos que el dueño sube desde el almacén
        protocol: "https",
        hostname: "rcboyxkkyafhiflzbroi.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
