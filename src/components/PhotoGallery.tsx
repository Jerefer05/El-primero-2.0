"use client";

import { useState } from "react";
import { buildZip } from "@/lib/zip";

type Photo = { name: string; size: number; url: string };

function formatSize(bytes: number) {
  if (!bytes) return "";
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

// El link de descarga de Supabase baja el archivo original con su nombre
function downloadUrl(photo: Photo) {
  return `${photo.url}?download=${encodeURIComponent(photo.name)}`;
}

export default function PhotoGallery({ orderId, photos }: { orderId: string; photos: Photo[] }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const totalSize = photos.reduce((sum, photo) => sum + photo.size, 0);

  async function downloadAll() {
    setError("");
    setProgress(0);
    try {
      const entries = [];
      for (const [index, photo] of photos.entries()) {
        const response = await fetch(photo.url);
        if (!response.ok) throw new Error(photo.name);
        entries.push({ name: photo.name, data: new Uint8Array(await response.arrayBuffer()) });
        setProgress(index + 1);
      }
      const link = document.createElement("a");
      link.href = URL.createObjectURL(buildZip(entries));
      link.download = `tesoria-fotos-${orderId.slice(0, 8)}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
    } catch {
      setError("No se pudo armar el .zip. Probá de nuevo o bajá las fotos de a una.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
        <p className="text-sm text-[#2E2E2E]/75">
          {photos.length} {photos.length === 1 ? "foto" : "fotos"} en calidad original
          {totalSize ? ` · ${formatSize(totalSize)}` : ""}
        </p>
        <button
          type="button"
          onClick={downloadAll}
          disabled={progress !== null}
          className="rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-sm tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-transparent hover:text-[#6E6353] disabled:cursor-wait disabled:opacity-70"
        >
          {progress === null
            ? "Descargar todas (.zip)"
            : `Preparando ${progress} de ${photos.length}…`}
        </button>
        {error && <p className="text-sm text-[#8a3a28]">{error}</p>}
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <li key={photo.name} className="overflow-hidden rounded-2xl border border-white/50 bg-white/40 shadow-whisper">
            <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block aspect-square bg-white/60">
              {/* La foto original, sin pasar por next/image para no recomprimirla */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.name} loading="lazy" className="h-full w-full object-cover" />
            </a>
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-[#2E2E2E]/75">
              <span className="truncate" title={photo.name}>
                {photo.name}
              </span>
              <a href={downloadUrl(photo)} className="shrink-0 underline">
                Bajar {formatSize(photo.size)}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
