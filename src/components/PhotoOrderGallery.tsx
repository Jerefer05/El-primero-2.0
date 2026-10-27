"use client";

import { useEffect, useState } from "react";
import {
  formatBytes,
  manifestPath,
  originalName,
  photoUrl,
  UUID_PATTERN,
  type PhotoOrderManifest,
} from "@/lib/photoOrder";
import { makeZip } from "@/lib/zip";

type State =
  | { status: "cargando" }
  | { status: "no-existe" }
  | { status: "listo"; order: PhotoOrderManifest };

type Loaded = { id: string; order: PhotoOrderManifest | null };

// Página del link que llega por WhatsApp: muestra las fotos del pedido y
// permite bajarlas una por una o todas juntas, en calidad original.
export default function PhotoOrderGallery({ id }: { id: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [zipping, setZipping] = useState("");
  const validId = UUID_PATTERN.test(id);

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    fetch(photoUrl(manifestPath(id)))
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
      .then((order: PhotoOrderManifest | null) => {
        if (!cancelled) setLoaded({ id, order: order?.photos ? order : null });
      });
    return () => {
      cancelled = true;
    };
  }, [id, validId]);

  const state: State = !validId
    ? { status: "no-existe" }
    : loaded?.id !== id
      ? { status: "cargando" }
      : loaded.order
        ? { status: "listo", order: loaded.order }
        : { status: "no-existe" };

  async function downloadAll(order: PhotoOrderManifest) {
    try {
      const files: { name: string; data: Uint8Array }[] = [];
      const used = new Set<string>();
      for (const [i, photo] of order.photos.entries()) {
        setZipping(`Preparando ${i + 1} de ${order.photos.length}…`);
        const response = await fetch(photoUrl(photo.path));
        if (!response.ok) throw new Error(`${response.status}`);
        let name = photo.name.replace(/[\\/]/g, "-") || originalName(photo.path);
        if (used.has(name)) name = `${i + 1}-${name}`;
        used.add(name);
        files.push({ name, data: new Uint8Array(await response.arrayBuffer()) });
      }
      const url = URL.createObjectURL(makeZip(files));
      const link = document.createElement("a");
      link.href = url;
      link.download = `tesoria-fotos-${id.slice(0, 8)}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setZipping("");
    } catch (error) {
      console.error("No se pudo armar el zip:", error);
      setZipping("No se pudieron bajar todas. Probá foto por foto.");
    }
  }

  if (state.status === "cargando") {
    return <p className="text-center text-sm text-[#2E2E2E]/70">Cargando fotos…</p>;
  }

  if (state.status === "no-existe") {
    return (
      <div className="text-center">
        <h1 className="title-soft font-serif text-3xl">No encontramos estas fotos</h1>
        <p className="mt-3 text-sm text-[#2E2E2E]/70">
          Revisá que el link esté completo.
        </p>
      </div>
    );
  }

  const { order } = state;
  const total = order.photos.reduce((sum, photo) => sum + photo.size, 0);
  const date = new Date(order.createdAt).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="mb-3 text-xs tracking-[0.22em] text-[#2E2E2E]/70 uppercase">
          Pedido de fotos
        </p>
        <h1 className="title-soft font-serif text-3xl md:text-4xl">
          {order.customerName || "Fotos del pedido"}
        </h1>
        <p className="mt-3 text-sm text-[#2E2E2E]/75">
          {[order.product, order.size, order.quantity && `${order.quantity} u.`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-1 text-xs text-[#2E2E2E]/60">
          {order.photos.length} {order.photos.length === 1 ? "foto" : "fotos"} ·{" "}
          {formatBytes(total)} · {date}
        </p>
        <button
          type="button"
          onClick={() => downloadAll(order)}
          disabled={zipping.startsWith("Preparando")}
          className="mt-6 rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-sm tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-transparent hover:text-[#6E6353] disabled:cursor-wait disabled:opacity-60"
        >
          Descargar todas (.zip)
        </button>
        {zipping && <p className="mt-2 text-xs text-[#2E2E2E]/70">{zipping}</p>}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {order.photos.map((photo) => (
          <li
            key={photo.path}
            className="overflow-hidden rounded-xl border border-white/50 bg-white/50"
          >
            <a href={photoUrl(photo.path)} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl(photo.path)}
                alt={photo.name}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </a>
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="truncate text-xs text-[#2E2E2E]/70" title={photo.name}>
                {formatBytes(photo.size)}
              </span>
              <a
                href={photoUrl(photo.path, true)}
                className="text-xs text-[#6E6353] underline underline-offset-2"
              >
                Descargar
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
