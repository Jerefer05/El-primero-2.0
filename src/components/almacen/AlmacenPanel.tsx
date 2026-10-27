"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserClient, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase";
import { formatPrice, type Product } from "@/data/products";
import { PRODUCT_COLUMNS, type ProductRow } from "@/data/productRow";
import { refreshStore } from "@/app/almacen/actions";
import OrdersPanel from "@/components/almacen/OrdersPanel";
import HistoryPanel from "@/components/almacen/HistoryPanel";
import SalesPanel from "@/components/almacen/SalesPanel";
import CouponsPanel from "@/components/almacen/CouponsPanel";
import ShippingPanel from "@/components/almacen/ShippingPanel";
import SettingsPanel from "@/components/almacen/SettingsPanel";
import { inputClass, primaryButton, secondaryButton } from "@/components/almacen/styles";

const CATEGORIES: { value: Product["category"]; label: string }[] = [
  { value: "velas", label: "Velas" },
  { value: "recarga", label: "Cera de recarga" },
];

const TABS = [
  { id: "pedidos", label: "Pedidos" },
  { id: "historial", label: "Historial" },
  { id: "ventas", label: "Ventas" },
  { id: "productos", label: "Productos" },
  { id: "cupones", label: "Cupones" },
  { id: "envios", label: "Envíos" },
  { id: "textos", label: "Textos y aviso" },
  { id: "contacto", label: "Pago y contacto" },
] as const;

type TabId = (typeof TABS)[number]["id"];

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
  return <AdminArea session={session} />;
}

// Barra de arriba (cuenta, contraseña, salir) y las pestañas del panel
function AdminArea({ session }: { session: Session }) {
  const supabase = getBrowserClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabId>("pedidos");
  const [changingPassword, setChangingPassword] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase
      .from("admins")
      .select("email")
      .eq("email", session.user.email ?? "")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(Boolean(data)));
  }, [supabase, session]);

  const signOut = () => supabase.auth.signOut();

  if (isAdmin === null) {
    return <p className="text-center text-sm text-[#2E2E2E]/70">Cargando…</p>;
  }
  if (!isAdmin) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#2E2E2E]/75">{session.user.email}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setChangingPassword((open) => !open)}
            className={secondaryButton}
          >
            Contraseña
          </button>
          <button type="button" onClick={signOut} className={secondaryButton}>
            Salir
          </button>
        </div>
      </div>

      {changingPassword && (
        <PasswordForm
          onDone={(message) => {
            setChangingPassword(false);
            setNotice(message);
          }}
        />
      )}

      {notice && (
        <p className="rounded-xl bg-white/60 px-4 py-3 text-sm text-[#2E2E2E]">
          {notice}
        </p>
      )}

      <nav
        aria-label="Secciones del almacén"
        className="flex gap-2 overflow-x-auto rounded-full border border-white/50 bg-white/40 p-1.5 shadow-whisper backdrop-blur-sm"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => {
              setNotice("");
              setTab(item.id);
            }}
            className={`flex-1 rounded-full px-4 py-2 text-xs tracking-[0.14em] whitespace-nowrap uppercase transition ${
              tab === item.id
                ? "bg-[#6E6353] text-[#f4eee6]"
                : "text-[#6E6353] hover:bg-white/60"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "pedidos" && <OrdersPanel />}
      {tab === "historial" && <HistoryPanel />}
      {tab === "ventas" && <SalesPanel />}
      {tab === "cupones" && <CouponsPanel />}
      {tab === "envios" && <ShippingPanel session={session} />}
      {tab === "productos" && <Inventory session={session} />}
      {tab === "textos" && <SettingsPanel session={session} section="textos" />}
      {tab === "contacto" && <SettingsPanel session={session} section="contacto" />}
    </div>
  );
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
  description: string;
  active: boolean;
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
    description: "",
    active: true,
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
    description: row.descripcion ?? "",
    active: row.active,
  };
}

function fetchProducts() {
  return getBrowserClient()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("featured", { ascending: false })
    .order("position")
    .order("name");
}

// Mismo orden que la tienda: por categoría, destacados primero y después la posición
function storeOrder(rows: ProductRow[]) {
  return CATEGORIES.flatMap((category) =>
    rows.filter((row) => row.category === category.value),
  );
}

function Inventory({ session }: { session: Session }) {
  const supabase = getBrowserClient();
  const [rows, setRows] = useState<ProductRow[]>([]);
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
    fetchProducts().then(applyProducts);
  }, [applyProducts]);

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

  async function toggleActive(row: ProductRow) {
    const { error } = await supabase
      .from("products")
      .update({ active: !row.active })
      .eq("id", row.id);
    if (error) {
      setNotice("No se pudo guardar el cambio.");
      return;
    }
    await afterChange(
      row.active
        ? `${row.name} quedó pausado: ya no se ve en la tienda.`
        : `${row.name} vuelve a verse en la tienda.`,
    );
  }

  async function toggleFeatured(row: ProductRow) {
    const { error } = await supabase
      .from("products")
      .update({ featured: !row.featured })
      .eq("id", row.id);
    if (error) {
      setNotice("No se pudo guardar el cambio.");
      return;
    }
    await afterChange(
      row.featured
        ? `${row.name} ya no está destacado.`
        : `${row.name} quedó destacado: aparece primero en la tienda.`,
    );
  }

  // Sube o baja un producto entre los de su misma categoría (y mismo
  // destacado), y renumera las posiciones para que no queden repetidas.
  async function move(row: ProductRow, direction: -1 | 1) {
    const ordered = storeOrder(rows);
    const group = ordered.filter(
      (item) => item.category === row.category && item.featured === row.featured,
    );
    const index = group.findIndex((item) => item.id === row.id);
    const neighbor = group[index + direction];
    if (!neighbor) return;
    const a = ordered.indexOf(row);
    const b = ordered.indexOf(neighbor);
    [ordered[a], ordered[b]] = [ordered[b], ordered[a]];

    const changes = ordered
      .map((item, i) => ({ item, position: i + 1 }))
      .filter(({ item, position }) => item.position !== position);
    const results = await Promise.all(
      changes.map(({ item, position }) =>
        supabase.from("products").update({ position }).eq("id", item.id),
      ),
    );
    if (results.some((result) => result.error)) {
      setNotice("No se pudo guardar el orden. Probá de nuevo.");
      await loadProducts();
      return;
    }
    await afterChange(`Listo, ${row.name} quedó ${direction < 0 ? "más arriba" : "más abajo"}.`);
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

  const nextPosition = rows.reduce((max, row) => Math.max(max, row.position), 0) + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#2E2E2E]/75">
          {rows.length} productos · {rows.filter((row) => !row.active).length} pausados
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

      <p className="text-xs text-[#2E2E2E]/70">
        Con las flechas cambiás el orden en la tienda. La estrella destaca un
        producto: aparece primero en su categoría, con un cartel de “Destacado”.
      </p>

      {CATEGORIES.map((category) => {
        const group = rows.filter((row) => row.category === category.value);
        if (group.length === 0) return null;
        return (
          <section key={category.value} className="space-y-2">
            <h2 className="font-serif text-xl">{category.label}</h2>
            <ul className="divide-y divide-[#6E6353]/15 overflow-hidden rounded-2xl border border-white/50 bg-white/40 shadow-whisper backdrop-blur-sm">
              {group.map((row) => {
                const soldOut = !row.in_stock || row.stock === 0;
                const sameGroup = group.filter((item) => item.featured === row.featured);
                const first = sameGroup[0]?.id === row.id;
                const last = sameGroup[sameGroup.length - 1]?.id === row.id;
                return (
                  <li
                    key={row.id}
                    className={`flex flex-wrap items-center gap-4 px-5 py-4 ${row.active ? "" : "bg-[#d7cbbe]/30"}`}
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => move(row, -1)}
                        disabled={first}
                        aria-label={`Subir ${row.name}`}
                        className="h-7 w-7 rounded-full border border-[#6E6353]/40 text-[#6E6353] transition hover:bg-[#6E6353] hover:text-[#f4eee6] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-[#6E6353]"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(row, 1)}
                        disabled={last}
                        aria-label={`Bajar ${row.name}`}
                        className="h-7 w-7 rounded-full border border-[#6E6353]/40 text-[#6E6353] transition hover:bg-[#6E6353] hover:text-[#f4eee6] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-[#6E6353]"
                      >
                        ↓
                      </button>
                    </div>
                    <div
                      className={`h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[#d7cbbe] ${row.active ? "" : "opacity-50"}`}
                    >
                      {row.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.image} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-lg">
                        {row.featured && <span className="mr-1 text-[#b08d3c]">★</span>}
                        {row.name}
                      </p>
                      <p className="text-xs text-[#2E2E2E]/70">
                        {formatPrice(row.price)} ·{" "}
                        {CATEGORIES.find((c) => c.value === row.category)?.label}
                        {row.stock !== null && ` · Stock: ${row.stock}`}
                        {soldOut && " · Agotado"}
                        {!row.active && " · Pausado (no se ve en la tienda)"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(row)}
                        aria-pressed={row.featured}
                        className={secondaryButton}
                      >
                        {row.featured ? "★ Destacado" : "☆ Destacar"}
                      </button>
                      <button type="button" onClick={() => toggleActive(row)} className={secondaryButton}>
                        {row.active ? "Pausar" : "Activar"}
                      </button>
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
          </section>
        );
      })}
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
      active: draft.active,
      caracteristicas: draft.features
        .map((feature) => ({ label: feature.label.trim(), value: feature.value.trim() }))
        .filter((feature) => feature.label && feature.value),
      descripcion: draft.description.trim(),
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
        <label className="block space-y-1.5 text-sm sm:col-span-2">
          <span>
            Descripción del producto (se ve en su página: tamaño, cuántas horas
            dura, aroma, cómo se recarga)
          </span>
          <textarea
            rows={4}
            maxLength={2000}
            value={draft.description}
            onChange={(event) => update("description", event.target.value)}
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
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) => update("active", event.target.checked)}
            className="h-4 w-4 accent-[#6E6353]"
          />
          Visible en la tienda (si lo destildás, queda pausado sin borrarse)
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
        Características (aroma, tamaño, peso, duración…). Salen en la página del producto y en el comprobante.
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

function PasswordForm({ onDone }: { onDone: (message: string) => void }) {
  const supabase = getBrowserClient();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setError("Usá al menos 8 caracteres.");
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) return setError("No se pudo cambiar la contraseña. Probá con otra.");
    onDone("Listo, la contraseña se cambió. La próxima vez entrá con la nueva.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/50 bg-white/50 px-6 py-5 shadow-whisper backdrop-blur-sm"
    >
      <label className="block min-w-60 flex-1 space-y-1.5 text-sm">
        <span>Nueva contraseña</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </label>
      <button type="submit" disabled={saving} className={primaryButton}>
        {saving ? "Guardando…" : "Cambiar"}
      </button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </form>
  );
}
