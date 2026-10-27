"use client";

import { FormEvent, useState } from "react";
import { STORE, whatsappLink } from "@/data/config";
import { useSiteSettings } from "@/context/SiteSettingsContext";

// Tamaños disponibles según el tipo de producto
const sizesByType: Record<string, string[]> = {
  Polaroid: ["Común (8x10cm)", "Mini (7x5cm)"],
  "Impresión simple": ["10x15cm", "15x20cm", "20x30cm"],
};

const productTypes = Object.keys(sizesByType);

export default function PhotoOrderForm() {
  const { whatsappNumber } = useSiteSettings();
  const [fileName, setFileName] = useState("");
  const [tipo, setTipo] = useState("");
  const [tamanio, setTamanio] = useState("");

  const availableSizes = sizesByType[tipo] ?? [];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      `¡Hola ${STORE.name}! Quiero hacer un pedido con foto:`,
      "",
      `• Nombre: ${data.get("nombre")}`,
      `• Email: ${data.get("email")}`,
      `• Teléfono: ${data.get("telefono")}`,
      `• Producto: ${data.get("tipo")}`,
      `• Tamaño: ${data.get("tamanio")}`,
      `• Cantidad: ${data.get("cantidad")}`,
      fileName
        ? `• Foto de referencia: ${fileName} (te la envío por este chat)`
        : "• Foto de referencia: te la envío por este chat",
    ].join("\n");
    window.open(whatsappLink(message, whatsappNumber), "_blank", "noopener,noreferrer");
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
        <p className="text-sm text-[#2E2E2E]">Subir imagen de referencia</p>
        <label
          htmlFor="referencia"
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#2E2E2E]/30 bg-white/45 px-4 py-8 text-center transition hover:border-[#2E2E2E]/50"
        >
          <span className="text-sm text-[#2E2E2E]/70">
            {fileName || "Arrastrá una imagen o hacé clic para elegirla"}
          </span>
          <input
            id="referencia"
            name="referencia"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              setFileName(event.target.files?.[0]?.name ?? "");
            }}
          />
        </label>
      </div>

      <button
        type="submit"
        className="w-full rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-sm tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-transparent hover:text-[#6E6353]"
      >
        Enviar pedido por WhatsApp
      </button>
      <p className="text-center text-xs text-[#2E2E2E]/65">
        Se abre WhatsApp con tu pedido armado. Adjuntá ahí la foto que querés
        imprimir.
      </p>
    </form>
  );
}
