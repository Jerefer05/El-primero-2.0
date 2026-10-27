"use client";

import { FormEvent, useState } from "react";
import { STORE, whatsappLink } from "@/data/config";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import PhotoUploader, { type UploadedPhotos } from "@/components/PhotoUploader";
import { createPublicClient } from "@/lib/supabase";
import {
  manifestPath,
  PHOTO_ORDERS_BUCKET,
  type PhotoOrderManifest,
} from "@/lib/photoOrder";

// Tamaños disponibles según el tipo de producto
const sizesByType: Record<string, string[]> = {
  Polaroid: ["Común (8x10cm)", "Mini (7x5cm)"],
  "Impresión simple": ["10x15cm", "15x20cm", "20x30cm"],
};

const productTypes = Object.keys(sizesByType);

export default function PhotoOrderForm() {
  const { whatsappNumber } = useSiteSettings();
  const [photos, setPhotos] = useState<UploadedPhotos>({
    files: [],
    uploading: 0,
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [tipo, setTipo] = useState("");
  const [tamanio, setTamanio] = useState("");

  const availableSizes = sizesByType[tipo] ?? [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    if (photos.uploading > 0) {
      setError("Esperá a que terminen de subirse las fotos.");
      return;
    }
    if (photos.files.length === 0) {
      setError("Subí al menos una foto para imprimir.");
      return;
    }
    setError("");
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "").trim();

    // La pestaña de WhatsApp se abre ya, antes de esperar a guardar el pedido:
    // si se abre después, el navegador del celular la bloquea.
    const whatsappTab = window.open("", "_blank");

    setSending(true);
    const orderId = crypto.randomUUID();
    const manifest: PhotoOrderManifest = {
      createdAt: new Date().toISOString(),
      customerName: field("nombre").slice(0, 80),
      product: field("tipo"),
      size: field("tamanio"),
      quantity: field("cantidad"),
      photos: photos.files,
    };
    const { error: saveError } = await createPublicClient()
      .storage.from(PHOTO_ORDERS_BUCKET)
      .upload(
        manifestPath(orderId),
        new Blob([JSON.stringify(manifest)], { type: "application/json" }),
        { contentType: "application/json", upsert: false },
      );
    setSending(false);
    if (saveError) {
      whatsappTab?.close();
      console.error("No se pudo guardar el pedido de fotos:", saveError.message);
      setError("No pudimos guardar tus fotos. Probá de nuevo en un momento.");
      return;
    }

    const count = photos.files.length;
    const message = [
      `¡Hola ${STORE.name}! Quiero hacer un pedido con foto:`,
      "",
      `• Nombre: ${field("nombre")}`,
      `• Email: ${field("email")}`,
      `• Teléfono: ${field("telefono")}`,
      `• Producto: ${field("tipo")}`,
      `• Tamaño: ${field("tamanio")}`,
      `• Cantidad: ${field("cantidad")}`,
      "",
      `📷 ${count === 1 ? "Mi foto" : `Mis ${count} fotos`} en calidad original:`,
      `${window.location.origin}/fotos/${orderId}`,
    ].join("\n");
    const url = whatsappLink(message, whatsappNumber);
    if (whatsappTab) {
      whatsappTab.opener = null;
      whatsappTab.location.href = url;
    } else {
      window.location.href = url;
    }
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

      <PhotoUploader photos={photos} onChange={setPhotos} />

      {error && (
        <p role="alert" className="text-center text-sm text-[#9a3b2e]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={photos.uploading > 0 || sending}
        className="disabled:cursor-wait disabled:opacity-60 w-full rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-sm tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-transparent hover:text-[#6E6353]"
      >
        {photos.uploading > 0
          ? "Subiendo fotos…"
          : sending
            ? "Preparando el link…"
            : "Enviar pedido por WhatsApp"}
      </button>
      <p className="text-center text-xs text-[#2E2E2E]/65">
        Se abre WhatsApp con tu pedido armado y un link para descargar tus
        fotos en calidad original. No hace falta adjuntarlas.
      </p>
    </form>
  );
}
