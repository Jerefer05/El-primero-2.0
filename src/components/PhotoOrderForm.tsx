"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { STORE, whatsappLink } from "@/data/config";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { createPublicClient, ORDER_PHOTOS_BUCKET } from "@/lib/supabase";

// Tamaños disponibles según el tipo de producto
const sizesByType: Record<string, string[]> = {
  Polaroid: ["Común (8x10cm)", "Mini (7x5cm)"],
  "Impresión simple": ["10x15cm", "15x20cm", "20x30cm"],
};

const productTypes = Object.keys(sizesByType);

const MAX_PHOTOS = 100;
const MAX_PHOTO_MB = 30;
const PARALLEL_UPLOADS = 3;

type Photo = { key: string; file: File; preview: string };

type Status =
  | { step: "editing" }
  | { step: "uploading"; done: number; total: number }
  | { step: "ready"; whatsapp: string; photosLink: string; total: number };

// Nombre de archivo seguro para guardar, manteniendo el orden en que se eligieron
function storageName(file: File, index: number) {
  const dot = file.name.lastIndexOf(".");
  const extension = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "jpg";
  const base = (dot > 0 ? file.name.slice(0, dot) : file.name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${String(index + 1).padStart(3, "0")}-${base || "foto"}.${extension}`;
}

export default function PhotoOrderForm() {
  const { whatsappNumber } = useSiteSettings();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tipo, setTipo] = useState("");
  const [tamanio, setTamanio] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>({ step: "editing" });
  const photosRef = useRef(photos);

  const availableSizes = sizesByType[tipo] ?? [];
  const uploading = status.step === "uploading";

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Libera las vistas previas al salir de la página
  useEffect(
    () => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview)),
    [],
  );

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError("");
    const incoming = Array.from(list);
    const images = incoming.filter((file) => file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name));
    const tooBig = images.filter((file) => file.size > MAX_PHOTO_MB * 1024 * 1024);
    const accepted = images.filter((file) => file.size <= MAX_PHOTO_MB * 1024 * 1024);
    const notes: string[] = [];
    if (images.length < incoming.length) notes.push("Algunos archivos no eran fotos y no se agregaron.");
    if (tooBig.length) notes.push(`${tooBig.length} foto(s) pesan más de ${MAX_PHOTO_MB} MB y no se agregaron.`);

    setPhotos((current) => {
      const known = new Set(current.map((photo) => photo.key));
      const room = MAX_PHOTOS - current.length;
      const fresh = accepted
        .map((file) => ({ key: `${file.name}-${file.size}-${file.lastModified}`, file }))
        .filter((photo) => !known.has(photo.key));
      if (fresh.length > room) notes.push(`Se pueden subir hasta ${MAX_PHOTOS} fotos por pedido.`);
      return [
        ...current,
        ...fresh.slice(0, Math.max(room, 0)).map((photo) => ({
          ...photo,
          preview: URL.createObjectURL(photo.file),
        })),
      ];
    });
    if (notes.length) setError(notes.join(" "));
  }

  function removePhoto(key: string) {
    setPhotos((current) =>
      current.filter((photo) => {
        if (photo.key === key) URL.revokeObjectURL(photo.preview);
        return photo.key !== key;
      }),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) return;
    if (!photos.length) {
      setError("Agregá al menos una foto para tu pedido.");
      return;
    }
    setError("");
    const data = new FormData(event.currentTarget);
    const orderId = crypto.randomUUID();
    const supabase = createPublicClient();
    const total = photos.length;
    let done = 0;
    let failed = 0;
    setStatus({ step: "uploading", done, total });

    // Sube las fotos de a varias a la vez, tal cual vienen (sin comprimir)
    const queue = photos.map((photo, index) => ({ photo, index }));
    async function worker() {
      for (let next = queue.shift(); next; next = queue.shift()) {
        const path = `${orderId}/${storageName(next.photo.file, next.index)}`;
        let ok = false;
        for (let attempt = 0; attempt < 2 && !ok; attempt++) {
          const { error: uploadError } = await supabase.storage
            .from(ORDER_PHOTOS_BUCKET)
            .upload(path, next.photo.file, {
              contentType: next.photo.file.type || "image/jpeg",
              cacheControl: "31536000",
            });
          ok = !uploadError;
        }
        if (ok) done++;
        else failed++;
        setStatus({ step: "uploading", done, total });
      }
    }
    await Promise.all(Array.from({ length: Math.min(PARALLEL_UPLOADS, total) }, worker));

    if (failed) {
      setStatus({ step: "editing" });
      setError(
        done
          ? `Se subieron ${done} de ${total} fotos. Revisá tu conexión y volvé a tocar "Enviar pedido".`
          : "No se pudieron subir las fotos. Revisá tu conexión y probá de nuevo.",
      );
      return;
    }

    const photosLink = `${window.location.origin}/fotos/${orderId}`;
    const message = [
      `¡Hola ${STORE.name}! Quiero hacer un pedido con foto:`,
      "",
      `• Nombre: ${data.get("nombre")}`,
      `• Email: ${data.get("email")}`,
      `• Teléfono: ${data.get("telefono")}`,
      `• Producto: ${data.get("tipo")}`,
      `• Tamaño: ${data.get("tamanio")}`,
      `• Cantidad: ${data.get("cantidad")}`,
      `• Fotos (${total}, calidad original): ${photosLink}`,
    ].join("\n");
    setStatus({ step: "ready", whatsapp: whatsappLink(message, whatsappNumber), photosLink, total });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (status.step === "ready") {
    return (
      <div className="mx-auto max-w-xl space-y-5 rounded-3xl border border-white/50 bg-white/40 backdrop-blur-sm p-6 text-center shadow-whisper sm:p-10">
        <p className="font-serif text-2xl text-[#2E2E2E]">¡Tus fotos ya están guardadas!</p>
        <p className="text-sm leading-7 text-[#2E2E2E]/75">
          Subimos {status.total} {status.total === 1 ? "foto" : "fotos"} en calidad original.
          Tocá el botón para mandarnos el pedido por WhatsApp: el link a tus fotos ya va
          incluido en el mensaje.
        </p>
        <a
          href={status.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-sm tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-transparent hover:text-[#6E6353]"
        >
          Enviar pedido por WhatsApp
        </a>
        <p className="text-xs text-[#2E2E2E]/65">
          Link de tus fotos:{" "}
          <a href={status.photosLink} target="_blank" rel="noopener noreferrer" className="break-all underline">
            {status.photosLink}
          </a>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-6 rounded-3xl border border-white/50 bg-white/40 backdrop-blur-sm p-6 shadow-whisper sm:p-10"
    >
      <div className="space-y-2">
        <label htmlFor="nombre" className="text-sm text-[#2E2E2E]">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          placeholder="Tu nombre"
          className="w-full rounded-xl border border-[#2E2E2E]/15 bg-white/60 px-4 py-3 text-[#2E2E2E] outline-none transition placeholder:text-[#2E2E2E]/45 focus:border-[#2E2E2E]/45"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm text-[#2E2E2E]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="hola@correo.com"
          className="w-full rounded-xl border border-[#2E2E2E]/15 bg-white/60 px-4 py-3 text-[#2E2E2E] outline-none transition placeholder:text-[#2E2E2E]/45 focus:border-[#2E2E2E]/45"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="telefono" className="text-sm text-[#2E2E2E]">
          Teléfono
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          required
          placeholder="11 1234 5678"
          className="w-full rounded-xl border border-[#2E2E2E]/15 bg-white/60 px-4 py-3 text-[#2E2E2E] outline-none transition placeholder:text-[#2E2E2E]/45 focus:border-[#2E2E2E]/45"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="tipo" className="text-sm text-[#2E2E2E]">
          Tipo de producto
        </label>
        <select
          id="tipo"
          name="tipo"
          value={tipo}
          onChange={(event) => {
            setTipo(event.target.value);
            setTamanio(""); // al cambiar de tipo se reinicia el tamaño
          }}
          required
          className="w-full rounded-xl border border-[#2E2E2E]/15 bg-white/60 px-4 py-3 text-[#2E2E2E] outline-none transition focus:border-[#2E2E2E]/45"
        >
          <option value="" disabled>
            Elegí un tipo
          </option>
          {productTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="tamanio" className="text-sm text-[#2E2E2E]">
          Tamaño
        </label>
        <select
          id="tamanio"
          name="tamanio"
          value={tamanio}
          onChange={(event) => setTamanio(event.target.value)}
          disabled={!tipo}
          required
          className="w-full rounded-xl border border-[#2E2E2E]/15 bg-white/60 px-4 py-3 text-[#2E2E2E] outline-none transition focus:border-[#2E2E2E]/45 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="" disabled>
            {tipo ? "Elegí un tamaño" : "Primero elegí un tipo de producto"}
          </option>
          {availableSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="cantidad" className="text-sm text-[#2E2E2E]">
          Cantidad
        </label>
        <input
          id="cantidad"
          name="cantidad"
          type="number"
          min={1}
          defaultValue={1}
          required
          className="w-full rounded-xl border border-[#2E2E2E]/15 bg-white/60 px-4 py-3 text-[#2E2E2E] outline-none transition focus:border-[#2E2E2E]/45"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-[#2E2E2E]">Tus fotos</p>
        <label
          htmlFor="referencia"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!uploading) addFiles(event.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-white/45 px-4 py-8 text-center transition hover:border-[#2E2E2E]/50 ${
            dragging ? "border-[#6E6353] bg-white/70" : "border-[#2E2E2E]/30"
          }`}
        >
          <span className="text-sm text-[#2E2E2E]/70">
            {photos.length
              ? "Tocá para agregar más fotos"
              : "Arrastrá tus fotos o hacé clic para elegirlas (podés elegir varias)"}
          </span>
          <span className="mt-1 text-xs text-[#2E2E2E]/50">
            Se guardan en calidad original, sin comprimir.
          </span>
          <input
            id="referencia"
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            disabled={uploading}
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = ""; // permite volver a elegir más fotos
            }}
          />
        </label>

        {photos.length > 0 && (
          <>
            <p className="text-xs text-[#2E2E2E]/65">
              {photos.length} {photos.length === 1 ? "foto elegida" : "fotos elegidas"}
            </p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((photo) => (
                <li key={photo.key} className="relative aspect-square overflow-hidden rounded-lg bg-white/60">
                  {/* Vista previa local: no pasa por next/image para no recomprimir */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.preview} alt={photo.file.name} className="h-full w-full object-cover" />
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.key)}
                      aria-label={`Quitar ${photo.file.name}`}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#2E2E2E]/70 text-xs text-white"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-[#b5523b]/10 px-4 py-3 text-sm text-[#8a3a28]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="w-full rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-sm tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-transparent hover:text-[#6E6353] disabled:cursor-wait disabled:opacity-70"
      >
        {status.step === "uploading"
          ? `Subiendo fotos ${status.done} de ${status.total}…`
          : "Enviar pedido"}
      </button>
      <p className="text-center text-xs text-[#2E2E2E]/65">
        Primero guardamos tus fotos y después se arma el mensaje de WhatsApp con el
        link para que las descarguemos en calidad original.
      </p>
    </form>
  );
}
