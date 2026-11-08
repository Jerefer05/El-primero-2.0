import { randomUUID } from "node:crypto";
import { createSecretClient, ORDER_PHOTOS_BUCKET } from "@/lib/supabase";
import { allowRequest, PHOTO_LIMIT } from "@/lib/rateLimit";
import { MAX_PHOTO_BYTES, MAX_PHOTOS, photoType, storageName } from "@/lib/photoRules";

// El formulario de /pedidos pide acá permiso para subir sus fotos. El servidor
// revisa cantidad, tipo y peso, aplica un límite por conexión y entrega un
// permiso firmado por foto. Así nadie puede subir directo a Supabase sin pasar
// por estos controles.

type PhotoRequest = { photos?: { name?: unknown; type?: unknown; size?: unknown }[] };

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: PhotoRequest;
  try {
    body = await request.json();
  } catch {
    return bad("Pedido inválido.");
  }

  const list = Array.isArray(body.photos) ? body.photos : [];
  if (list.length === 0) return bad("Agregá al menos una foto para tu pedido.");
  if (list.length > MAX_PHOTOS) return bad(`Se pueden subir hasta ${MAX_PHOTOS} fotos por pedido.`);

  const photos: { name: string; type: string }[] = [];
  for (const item of list) {
    const name = typeof item.name === "string" ? item.name.slice(0, 200) : "";
    const size = Number(item.size);
    const type = photoType(name, typeof item.type === "string" ? item.type : "");
    if (!name || !type) return bad("Solo se pueden subir fotos JPG, PNG, WebP o HEIC.");
    if (!Number.isFinite(size) || size <= 0 || size > MAX_PHOTO_BYTES) {
      return bad("Alguna foto pesa demasiado. El máximo es 30 MB por foto.");
    }
    photos.push({ name, type });
  }

  // El límite se cuenta después de validar, así un error de tipeo no gasta intentos.
  if (!(await allowRequest(request, PHOTO_LIMIT))) {
    return bad(
      "Recibimos muchos pedidos de fotos desde tu conexión. Esperá un rato o escribinos por WhatsApp.",
      429,
    );
  }

  const supabase = createSecretClient();
  if (!supabase) {
    console.error("Falta SUPABASE_SECRET_KEY: no se pueden firmar subidas de fotos.");
    return bad("No pudimos preparar la subida. Probá de nuevo en un rato.", 503);
  }

  const orderId = randomUUID();
  const bucket = supabase.storage.from(ORDER_PHOTOS_BUCKET);
  const uploads: { path: string; token: string; type: string }[] = [];
  // De a 10 por vez para no saturar a Supabase con 100 pedidos juntos.
  for (let start = 0; start < photos.length; start += 10) {
    const batch = photos.slice(start, start + 10);
    const signed = await Promise.all(
      batch.map(async (photo, offset) => {
        const path = `${orderId}/${storageName(photo.name, start + offset)}`;
        const { data, error } = await bucket.createSignedUploadUrl(path);
        if (error || !data) {
          console.error("No se pudo firmar la subida de una foto:", error?.message);
          return null;
        }
        return { path: data.path, token: data.token, type: photo.type };
      }),
    );
    if (signed.some((item) => item === null)) {
      return bad("No pudimos preparar la subida. Probá de nuevo en un rato.", 503);
    }
    uploads.push(...(signed as { path: string; token: string; type: string }[]));
  }

  return Response.json({ orderId, uploads });
}
