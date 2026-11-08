// Reglas de las fotos que suben los clientes en /pedidos. Las usan el
// formulario (navegador) y /api/fotos (servidor), así no se desfasan.

export const MAX_PHOTOS = 100;
export const MAX_PHOTO_MB = 30;
export const MAX_PHOTO_BYTES = MAX_PHOTO_MB * 1024 * 1024;

// Solo fotos comunes. SVG queda afuera porque puede llevar código adentro.
const TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export const ALLOWED_PHOTO_TYPES = [...new Set(Object.values(TYPES_BY_EXTENSION))];

export const PHOTO_ACCEPT = [
  ...ALLOWED_PHOTO_TYPES,
  ...Object.keys(TYPES_BY_EXTENSION).map((extension) => `.${extension}`),
].join(",");

// Tipo de la foto. Algunos celulares mandan las HEIC sin tipo: se deduce por
// la extensión. Devuelve null si no es una foto permitida.
export function photoType(name: string, type: string): string | null {
  const lower = type.toLowerCase();
  if (ALLOWED_PHOTO_TYPES.includes(lower)) return lower;
  if (lower && lower !== "application/octet-stream") return null;
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return TYPES_BY_EXTENSION[extension] ?? null;
}

// Nombre de archivo seguro para guardar, manteniendo el orden en que se eligieron.
export function storageName(name: string, index: number) {
  const dot = name.lastIndexOf(".");
  const rawExtension = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const extension = TYPES_BY_EXTENSION[rawExtension] ? rawExtension : "jpg";
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${String(index + 1).padStart(3, "0")}-${base || "foto"}.${extension}`;
}
