// Se usa tanto en el servidor como en el navegador (almacén y contexto).
import { STORE } from "@/data/config";

// Textos y datos de la tienda que el dueño edita desde el almacén.
export type SiteSettings = {
  heroKicker: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutSubtitle: string;
  aboutValues: { title: string; description: string }[];
  whatsappNumber: string;
  instagramUrl: string;
  hours: string;
  transfer: { alias: string; cbu: string; holder: string };
  banner: { active: boolean; text: string };
};

// Forma de la fila en la tabla `site_settings` de Supabase.
export type SettingsRow = {
  hero_kicker: string;
  hero_title: string;
  hero_subtitle: string;
  about_title: string;
  about_subtitle: string;
  about_values: { title: string; description: string }[];
  whatsapp_number: string;
  instagram_url: string;
  hours: string;
  transfer_alias: string;
  transfer_cbu: string;
  transfer_holder: string;
  banner_active: boolean;
  banner_text: string;
};

export const SETTINGS_COLUMNS =
  "hero_kicker, hero_title, hero_subtitle, about_title, about_subtitle, about_values, whatsapp_number, instagram_url, hours, transfer_alias, transfer_cbu, transfer_holder, banner_active, banner_text";

// Respaldo por si la base no responde
export const DEFAULT_SETTINGS: SiteSettings = {
  heroKicker: "Velas artesanales · Home deco",
  heroTitle: "Bienvenidos a Tesoria",
  heroSubtitle:
    "Ilumina tu hogar sin límites con nuestras velas recargables. Home deco, arte nostálgico.",
  aboutTitle: "Nuestra esencia",
  aboutSubtitle: "Minimalismo cálido, armonía y un recuerdo que permanece.",
  aboutValues: [
    {
      title: "Tranquilidad",
      description:
        "Una llama suave, aromas serenos y un rincón de calma para el ritmo de cada día.",
    },
    {
      title: "Experiencia sensorial",
      description:
        "Texturas, luz y perfume se encuentran para vestir el hogar con una atmósfera íntima.",
    },
    {
      title: "Autenticidad",
      description:
        "Hecho a mano, con paciencia y oficio. Cada pieza guarda un gesto único.",
    },
  ],
  whatsappNumber: STORE.whatsappNumber,
  instagramUrl: STORE.instagramUrl,
  hours: STORE.hours,
  transfer: STORE.transfer,
  banner: { active: false, text: "" },
};

export function rowToSettings(row: SettingsRow): SiteSettings {
  return {
    heroKicker: row.hero_kicker,
    heroTitle: row.hero_title || DEFAULT_SETTINGS.heroTitle,
    heroSubtitle: row.hero_subtitle,
    aboutTitle: row.about_title || DEFAULT_SETTINGS.aboutTitle,
    aboutSubtitle: row.about_subtitle,
    aboutValues: row.about_values ?? [],
    whatsappNumber: row.whatsapp_number,
    instagramUrl: row.instagram_url,
    hours: row.hours,
    transfer: {
      alias: row.transfer_alias,
      cbu: row.transfer_cbu,
      holder: row.transfer_holder,
    },
    banner: { active: row.banner_active, text: row.banner_text },
  };
}

// Lo que necesitan los componentes del navegador (carrito, comprobante, etc.)
export type ContactSettings = Pick<
  SiteSettings,
  "whatsappNumber" | "instagramUrl" | "hours" | "transfer"
>;
