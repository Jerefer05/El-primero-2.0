"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserClient, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase";
import { formatPrice, type Product } from "@/data/products";
import { PRODUCT_COLUMNS, type ProductRow } from "@/data/productRow";
import { refreshStore } from "@/app/almacen/actions";

const CATEGORIES: { value: Product["category"]; label: string }[] = [
  { value: "velas", label: "Velas" },
  { value: "recarga", label: "Cera de recarga" },
];

const inputClass =
  "w-full rounded-xl border border-[#6E6353]/30 bg-white/70 px-4 py-2.5 text-sm text-[#2E2E2E] outline-none transition focus:border-[#6E6353]";
const primaryButton =
  "rounded-full bg-[#6E6353] px-6 py-2.5 text-xs tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-[#2E2E2E] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "rounded-full border border-[#6E6353] px-5 py-2 text-xs tracking-[0.16em] text-[#6E6353] uppercase transition hover:bg-[#6E6353] hover:text-[#f4eee6] disabled:cursor-not-allowed disabled:opacity-50";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AlmacenPanel() {
  const supabase = getBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (checking) {
    return <p className="text-center text-sm text-[#2E2E2E]/70">Cargando…</p>;
  }
  if (!session) {
    return <LoginForm />;
  }
  return <Inventory session={session} />;
}

function LoginForm() {
  const supabase = getBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (loginError) {
      setError("El mail o la contraseña no son correctos.");
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-sm space-y-4 rounded-2xl border border-white/50 bg-white/40 px-7 py-8 shadow-whisper backdrop-blur-sm"
    >
      <label className="block space-y-1.5 text-sm">
        <span>Mail</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span>Contraseña</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className={`${primaryButton} w-full`}>
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

type Draft = {
  id: string | null;
  name: string;
  price: string;
  category: Product["category"];
  stock: string;
  inStock: boolean;
  image: string;
  alt: string;
  position: string;
  features: { label: string; value: string }[];
};

function emptyDraft(nextPosition: number): Draft {
  return {
    id: null,
    name: "",
    price: "",
    category: "velas",
    stock: "",
    inStock: true,
    image: "",
    alt: "",
    position: String(nextPosition),
    features: [],
  };
}

function rowToDraft(row: ProductRow): Draft {
  return {
    id: row.id,
    name: row.name,
    price: String(row.price),
    category: row.category,
    stock: row.stock === null ? "" : String(row.stock),
    inStock: row.in_stock,
    image: row.image,
    alt: row.alt,
    position: String(row.position),
    features: row.caracteristicas ?? [],
  };
}

function fetchProducts() {
  return getBrowserClient()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("position")
    .order("name");
}

function Inventory({ session }: { session: Session }) {
  const supabase = getBrowserClient();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const applyProducts = useCallback(
    ({ data, error }: { data: unknown; error: unknown }) => {
      if (error) {
        setNotice("No se pudieron cargar los productos. Probá recargar la página.");
        return;
      }
      setRows(data as ProductRow[]);
    },
    [],
  );

  const loadProducts = useCallback(
    () => fetchProducts().then(applyProducts),
    [applyProducts],
  );

  useEffect(() => {
    supabase
      .from("admins")
      .select("email")
      .eq("email", session.user.email ?? "")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(Boolean(data)));
    fetchProducts().then(applyProducts);
  }, [supabase, session, applyProducts]);

  async function afterChange(message: string) {
    await loadProducts();
    await refreshStore(session.access_token);
    setNotice(message);
  }

  async function toggleStock(row: ProductRow) {
    const { error } = await supabase
      .from("products")
      .update({ in_stock: !row.in_stock })
      .eq("id", row.id);
    if (error) {
      setNotice("No se pudo guardar el cambio.");
      return;
    }
    await afterChange(
      row.in_stock ? `${row.name} quedó como agotado.` : `${row.name} vuelve a estar disponible.`,
    );
  }

  async function deleteProduct(row: ProductRow) {
    const { error } = await supabase.from("products").delete().eq("id", row.id);
    setConfirmDelete(null);
    if (error) {
      setNotice("No se pudo borrar el producto.");
      return;
    }
    await afterChange(`${row.name} se borró de la tienda.`);
  }

  const signOut = () => supabase.auth.signOut();

  if (isAdmin === false) {
    return (
      <div className="space-y-4 text-center text-sm">
        <p>
          La cuenta {session.user.email} no tiene permiso para editar el
          almacén.
        </p>
        <button type="button" onClick={signOut} className={secondaryButton}>
          Salir
        </button>
      </div>
    );
  }

  const nextPosition = rows.reduce((max, row) => Math.max(max, row.position), 0) + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#2E2E2E]/75">
          {rows.length} productos · {session.user.email}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setNotice("");
              setDraft(emptyDraft(nextPosition));
            }}
            className={primaryButton}
          >
            Agregar producto
          </button>
          <button type="button" onClick={signOut} className={secondaryButton}>
            Salir
          </button>
        </div>
      </div>

      {notice && (
        <p className="rounded-xl bg-white/60 px-4 py-3 text-sm text-[#2E2E2E]">
          {notice}
        </p>
      )}

      {draft && (
        <ProductForm
          key={draft.id ?? "nuevo"}
          draft={draft}
          existingIds={rows.map((row) => row.id)}
          onCancel={() => setDraft(null)}
          onSaved={async (name) => {
            setDraft(null);
            await afterChange(`${name} se guardó.`);
          }}
        />
      )}

      <ul className="divide-y divide-[#6E6353]/15 overflow-hidden rounded-2xl border border-white/50 bg-white/40 shadow-whisper backdrop-blur-sm">
        {rows.map((row) => {
          const soldOut = !row.in_stock || row.stock === 0;
          return (
            <li key={row.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[#d7cbbe]">
                {row.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.image} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg">{row.name}</p>
                <p className="text-xs text-[#2E2E2E]/70">
                  {formatPrice(row.price)} ·{" "}
                  {CATEGORIES.find((c) => c.value === row.category)?.label}
                  {row.stock !== null && ` · Stock: ${row.stock}`}
                  {soldOut && " · Agotado"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => toggleStock(row)} className={secondaryButton}>
                  {row.in_stock ? "Marcar agotado" : "Hay stock"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotice("");
                    setDraft(rowToDraft(row));
                  }}
                  className={secondaryButton}
                >
                  Editar
                </button>
                {confirmDelete === row.id ? (
                  <button
                    type="button"
                    onClick={() => deleteProduct(row)}
                    className="rounded-full bg-red-700 px-5 py-2 text-xs tracking-[0.16em] text-white uppercase"
                  >
                    ¿Seguro? Borrar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(row.id)}
                    className={secondaryButton}
                  >
                    Borrar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProductForm({
  draft: initialDraft,
  existingIds,
  onCancel,
  onSaved,
}: {
  draft: Draft;
  existingIds: string[];
  onCancel: () => void;
  onSaved: (name: string) => Promise<void>;
}) {
  const supabase = getBrowserClient();
  const [draft, setDraft] = useState(initialDraft);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(initialDraft.image);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function pickFile(selected: File | null) {
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : draft.image);
  }

  function newId(name: string) {
    const base = slugify(name) || "producto";
    let id = base;
    let n = 2;
    while (existingIds.includes(id)) {
      id = `${base}-${n++}`;
    }
    return id;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const price = Number(draft.price);
    const stock = draft.stock.trim() === "" ? null : Number(draft.stock);
    if (!draft.name.trim()) return setError("Poné un nombre.");
    if (!Number.isInteger(price) || price < 0) return setError("El precio tiene que ser un número entero, sin puntos.");
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) return setError("El stock tiene que ser un número entero o quedar vacío.");
    if (!file && !draft.image) return setError("Subí una foto del producto.");

    setSaving(true);
    const id = draft.id ?? newId(draft.name);
    let image = draft.image;

    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${id}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        setSaving(false);
        return setError("No se pudo subir la foto. Probá con una JPG o PNG de menos de 5 MB.");
      }
      image = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
    }

    const { error: saveError } = await supabase.from("products").upsert({
      id,
      name: draft.name.trim(),
      price,
      category: draft.category,
      stock,
      in_stock: draft.inStock,
      image,
      alt: draft.alt.trim() || draft.name.trim(),
      position: Number(draft.position) || 0,
      caracteristicas: draft.features
        .map((feature) => ({ label: feature.label.trim(), value: feature.value.trim() }))
        .filter((feature) => feature.label && feature.value),
    });
    setSaving(false);
    if (saveError) {
      return setError("No se pudo guardar. Probá de nuevo.");
    }
    await onSaved(draft.name.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-2xl border border-white/50 bg-white/50 px-6 py-7 shadow-whisper backdrop-blur-sm md:grid-cols-[180px_1fr]"
    >
      <div className="space-y-3">
        <div className="aspect-[4/5] overflow-hidden rounded-xl bg-[#d7cbbe]">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <label className={`${secondaryButton} block cursor-pointer text-center`}>
          {preview ? "Cambiar foto" : "Subir foto"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm sm:col-span-2">
          <span>Nombre</span>
          <input
            required
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>Precio (sin puntos, ej: 15000)</span>
          <input
            required
            inputMode="numeric"
            value={draft.price}
            onChange={(event) => update("price", event.target.value.replace(/\D/g, ""))}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>Categoría</span>
          <select
            value={draft.category}
            onChange={(event) => update("category", event.target.value as Product["category"])}
            className={inputClass}
          >
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>Stock (vacío si no lo contás)</span>
          <input
            inputMode="numeric"
            value={draft.stock}
            onChange={(event) => update("stock", event.target.value.replace(/\D/g, ""))}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>Orden en la tienda</span>
          <input
            inputMode="numeric"
            value={draft.position}
            onChange={(event) => update("position", event.target.value.replace(/\D/g, ""))}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5 text-sm sm:col-span-2">
          <span>Descripción de la foto (opcional, ayuda a buscadores)</span>
          <input
            value={draft.alt}
            onChange={(event) => update("alt", event.target.value)}
            className={inputClass}
          />
        </label>
        <FeaturesEditor
          features={draft.features}
          onChange={(features) => update("features", features)}
        />
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={draft.inStock}
            onChange={(event) => update("inStock", event.target.checked)}
            className="h-4 w-4 accent-[#6E6353]"
          />
          Disponible para comprar (si lo destildás, se ve como “Agotado”)
        </label>
        {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
        <div className="flex gap-3 sm:col-span-2">
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" onClick={onCancel} className={secondaryButton}>
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}

type Feature = { label: string; value: string };

function FeaturesEditor({
  features,
  onChange,
}: {
  features: Feature[];
  onChange: (features: Feature[]) => void;
}) {
  function change(index: number, key: keyof Feature, value: string) {
    onChange(features.map((feature, i) => (i === index ? { ...feature, [key]: value } : feature)));
  }

  return (
    <fieldset className="space-y-2 text-sm sm:col-span-2">
      <legend className="mb-1.5">
        Características (aroma, tamaño, peso, cera, mecha…). Salen en el comprobante del pedido.
      </legend>
      {features.map((feature, index) => (
        <div key={index} className="flex gap-2">
          <input
            placeholder="Ej: Aroma"
            value={feature.label}
            onChange={(event) => change(index, "label", event.target.value)}
            className={`${inputClass} w-2/5`}
          />
          <input
            placeholder="Ej: Vainilla"
            value={feature.value}
            onChange={(event) => change(index, "value", event.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            aria-label="Quitar característica"
            onClick={() => onChange(features.filter((_, i) => i !== index))}
            className="px-2 text-lg text-[#6E6353]"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...features, { label: "", value: "" }])}
        className={secondaryButton}
      >
        Agregar característica
      </button>
    </fieldset>
  );
}
