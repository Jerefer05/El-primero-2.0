"use client";

import { DragEvent, useEffect, useRef, useState } from "react";
import { createPublicClient } from "@/lib/supabase";
import {
  formatBytes,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS,
  PHOTO_ORDERS_BUCKET,
  type PhotoFile,
} from "@/lib/photoOrder";

export type UploadedPhotos = {
  files: PhotoFile[]; // fotos ya subidas, en el orden en que se eligieron
  uploading: number; // fotos que todavía se están subiendo
};

type Photo = {
  key: number;
  name: string;
  size: number;
  preview: string;
  path: string;
  status: "subiendo" | "lista" | "error";
};

// Algunos celulares no informan el tipo de las fotos HEIC del iPhone.
function contentType(file: File) {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "heic" || ext === "heif") return `image/${ext}`;
  if (ext === "png" || ext === "webp" || ext === "gif") return `image/${ext}`;
  return "image/jpeg";
}

function safeName(name: string) {
  const clean = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean.slice(-80) || "foto.jpg";
}

const PARALLEL_UPLOADS = 3;

// Sube las fotos tal cual (sin comprimir) apenas el cliente las elige, así al
// tocar "Enviar" el link ya está listo y WhatsApp se abre al instante.
export default function PhotoUploader({
  photos,
  onChange,
}: {
  photos: UploadedPhotos;
  onChange: (photos: UploadedPhotos) => void;
}) {
  const [items, setItems] = useState<Photo[]>([]);
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const folder = useRef("");
  const nextKey = useRef(1);
  const queue = useRef<{ key: number; path: string; file: File }[]>([]);
  const active = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const files = items
      .filter((item) => item.status === "lista")
      .map(({ path, name, size }) => ({ path, name, size }));
    const uploading = items.filter((item) => item.status === "subiendo").length;
    const same =
      uploading === photos.uploading &&
      files.length === photos.files.length &&
      files.every((file, i) => file.path === photos.files[i].path);
    if (!same) onChange({ files, uploading });
  }, [items, photos, onChange]);

  // Las vistas previas se liberan al salir de la página.
  const previews = useRef<string[]>([]);
  useEffect(
    () => () => previews.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );

  function setStatus(key: number, status: Photo["status"]) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, status } : item)),
    );
  }

  function pump() {
    while (active.current < PARALLEL_UPLOADS && queue.current.length > 0) {
      const job = queue.current.shift()!;
      active.current++;
      upload(job.key, job.path, job.file).finally(() => {
        active.current--;
        pump();
      });
    }
  }

  async function upload(key: number, path: string, file: File) {
    const { error } = await createPublicClient()
      .storage.from(PHOTO_ORDERS_BUCKET)
      .upload(path, file, {
        contentType: contentType(file),
        cacheControl: "31536000",
        upsert: false,
      });
    if (error) console.error("No se pudo subir la foto:", error.message);
    setStatus(key, error ? "error" : "lista");
  }

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    if (!folder.current) folder.current = crypto.randomUUID();

    const room = MAX_PHOTOS - items.length;
    const files = Array.from(list);
    const images = files.filter(
      (file) =>
        (file.type.startsWith("image/") || !file.type) &&
        file.size <= MAX_PHOTO_BYTES,
    );
    const accepted = images.slice(0, Math.max(0, room));

    const skipped = files.length - accepted.length;
    setNotice(
      skipped > 0
        ? `${skipped === 1 ? "Una foto no se agregó" : `${skipped} fotos no se agregaron`}: aceptamos hasta ${MAX_PHOTOS} imágenes de ${formatBytes(MAX_PHOTO_BYTES)} cada una.`
        : "",
    );
    if (accepted.length === 0) return;

    const added = accepted.map((file) => {
      const key = nextKey.current++;
      const path = `${folder.current}/${String(key).padStart(3, "0")}-${safeName(file.name)}`;
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      queue.current.push({ key, path, file });
      return {
        key,
        name: file.name,
        size: file.size,
        preview,
        path,
        status: "subiendo" as const,
      };
    });
    setItems((current) => [...current, ...added]);
    pump();
  }

  function retry(key: number) {
    const input = inputRef.current;
    // Sin el archivo original a mano, se saca y se vuelve a elegir.
    setItems((current) => current.filter((item) => item.key !== key));
    input?.click();
  }

  // Quitar una foto la saca del pedido: el link solo muestra las de la lista.
  function remove(key: number) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  const totalSize = items.reduce((sum, item) => sum + item.size, 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#2E2E2E]">Tus fotos</p>
      <label
        htmlFor="fotos"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition hover:border-[#2E2E2E]/50 ${
          dragging
            ? "border-[#6E6353] bg-white/70"
            : "border-[#2E2E2E]/30 bg-white/45"
        }`}
      >
        <span className="text-sm text-[#2E2E2E]/80">
          {items.length > 0
            ? "Tocá para sumar más fotos"
            : "Arrastrá tus fotos o tocá para elegirlas"}
        </span>
        <span className="mt-1 text-xs text-[#2E2E2E]/55">
          Podés elegir varias a la vez. Se suben en calidad original.
        </span>
        <input
          ref={inputRef}
          id="fotos"
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = ""; // permite volver a elegir las mismas
          }}
        />
      </label>

      {notice && <p className="text-xs text-[#9a3b2e]">{notice}</p>}

      {items.length > 0 && (
        <>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((item) => (
              <li
                key={item.key}
                className="relative aspect-square overflow-hidden rounded-lg bg-white/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt={item.name}
                  className={`h-full w-full object-cover transition ${
                    item.status === "subiendo" ? "opacity-50" : ""
                  }`}
                />
                {item.status === "subiendo" && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/45 py-1 text-center text-[10px] text-white">
                    Subiendo…
                  </span>
                )}
                {item.status === "error" && (
                  <button
                    type="button"
                    onClick={() => retry(item.key)}
                    className="absolute inset-0 flex items-center justify-center bg-[#9a3b2e]/75 px-1 text-center text-[11px] text-white"
                  >
                    No se subió. Tocá para elegirla de nuevo
                  </button>
                )}
                {item.status === "lista" && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-white/85 px-1.5 text-[10px] text-[#2E2E2E]">
                    ✓
                  </span>
                )}
                {item.status !== "subiendo" && (
                  <button
                    type="button"
                    onClick={() => remove(item.key)}
                    aria-label={`Quitar ${item.name}`}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-sm text-[#2E2E2E] shadow"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#2E2E2E]/65">
            {items.length} {items.length === 1 ? "foto" : "fotos"} ·{" "}
            {formatBytes(totalSize)}
            {photos.uploading > 0 && ` · subiendo ${photos.uploading}…`}
          </p>
        </>
      )}
    </div>
  );
}
