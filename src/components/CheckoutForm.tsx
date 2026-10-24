"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/data/products";
import { STORE } from "@/data/config";
import { useCart } from "@/context/CartContext";
import {
  computeTotals,
  isValidCoupon,
  LAST_ORDER_KEY,
  PAYMENT_LABELS,
  SHIPPING_LABELS,
  type Order,
  type PaymentMethod,
  type ShippingMethod,
} from "@/lib/order";

const inputClass =
  "w-full rounded-xl border border-[#2E2E2E]/15 bg-white/60 px-4 py-3 text-[#2E2E2E] outline-none transition placeholder:text-[#2E2E2E]/45 focus:border-[#2E2E2E]/45";

function Field({
  id,
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="text-sm text-[#2E2E2E]">
        {label}
      </label>
      <input id={id} name={id} className={inputClass} {...props} />
    </div>
  );
}

function Choice<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(Object.keys(options) as T[]).map((key) => (
        <label
          key={key}
          className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition ${
            value === key
              ? "border-[#6E6353] bg-[#6E6353] text-[#f4eee6]"
              : "border-[#2E2E2E]/15 bg-white/60 text-[#2E2E2E]"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={key}
            checked={value === key}
            onChange={() => onChange(key)}
            className="sr-only"
          />
          {options[key]}
        </label>
      ))}
    </div>
  );
}

export default function CheckoutForm() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [shipping, setShipping] = useState<ShippingMethod>("envio");
  const [payment, setPayment] = useState<PaymentMethod>("transferencia");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const totals = computeTotals(items, shipping, payment, coupon);

  function applyCoupon() {
    if (isValidCoupon(couponInput)) {
      setCoupon(couponInput.trim().toUpperCase());
      setCouponError("");
    } else {
      setCoupon(null);
      setCouponError("Ese código no es válido.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const field = (key: string) => String(data.get(key) ?? "");

    try {
      const response = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ id, quantity }) => ({ id, quantity })),
          customer: {
            name: field("name"),
            email: field("email"),
            phone: field("phone"),
            address: field("address"),
            city: field("city"),
            notes: field("notes"),
          },
          shipping,
          payment,
          coupon,
          website: field("website"),
        }),
      });
      const result = (await response.json()) as {
        order?: Order;
        error?: string;
      };
      if (!response.ok || !result.order) {
        throw new Error(result.error ?? "No pudimos registrar el pedido.");
      }
      try {
        window.localStorage.setItem(
          LAST_ORDER_KEY,
          JSON.stringify(result.order),
        );
      } catch {
        // sin almacenamiento igual mostramos el comprobante en esta visita
      }
      clearCart();
      router.push("/checkout/listo");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos registrar el pedido.",
      );
      setSending(false);
    }
  }

  if (items.length === 0 && !sending) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-white/50 bg-white/40 p-10 text-center shadow-whisper backdrop-blur-sm">
        <p className="text-sm text-[#2E2E2E]/75">Tu carrito está vacío.</p>
        <Link
          href="/#catalogo"
          className="mt-6 inline-block rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-sm tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-transparent hover:text-[#6E6353]"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start"
    >
      <div className="space-y-8 rounded-3xl border border-white/50 bg-white/40 p-6 shadow-whisper backdrop-blur-sm sm:p-10">
        <fieldset className="space-y-5">
          <legend className="mb-4 font-serif text-2xl text-[#6E6353]">
            Tus datos
          </legend>
          <Field
            id="name"
            label="Nombre y apellido"
            required
            autoComplete="name"
            placeholder="Tu nombre"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              placeholder="hola@correo.com"
            />
            <Field
              id="phone"
              label="WhatsApp"
              type="tel"
              required
              autoComplete="tel"
              placeholder="11 2233 4455"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-4 font-serif text-2xl text-[#6E6353]">
            Entrega
          </legend>
          <Choice
            name="shipping"
            options={SHIPPING_LABELS}
            value={shipping}
            onChange={setShipping}
          />
          {shipping === "envio" && (
            <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
              <Field
                id="address"
                label="Dirección"
                required
                autoComplete="street-address"
                placeholder="Calle, número, piso y depto"
              />
              <Field
                id="city"
                label="Localidad"
                required
                autoComplete="address-level2"
                placeholder="Ciudad"
              />
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-4 font-serif text-2xl text-[#6E6353]">
            Pago
          </legend>
          <Choice
            name="payment"
            options={PAYMENT_LABELS}
            value={payment}
            onChange={setPayment}
          />
          <p className="text-xs text-[#2E2E2E]/60">
            {payment === "transferencia"
              ? "Al confirmar te mostramos el alias para transferir."
              : "Pagás al recibir o retirar tu pedido."}
          </p>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm text-[#2E2E2E]">
            Nota (opcional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={500}
            placeholder="Es para regalo, horario de entrega, etc."
            className={inputClass}
          />
        </div>

        {/* Campo trampa: las personas no lo ven, los bots lo completan */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
      </div>

      <aside className="space-y-5 rounded-3xl border border-white/50 bg-white/60 p-6 shadow-whisper backdrop-blur-sm lg:sticky lg:top-24">
        <h2 className="font-serif text-2xl text-[#6E6353]">Tu pedido</h2>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-[#d7cbbe]">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate text-[#2E2E2E]">{item.name}</p>
                <p className="text-xs text-[#2E2E2E]/60">× {item.quantity}</p>
              </div>
              <p className="text-sm text-[#2E2E2E]">
                {formatPrice(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <div className="border-t border-[#6E6353]/15 pt-4">
          <label htmlFor="coupon" className="text-xs text-[#2E2E2E]/70">
            ¿Tenés un cupón?
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="coupon"
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
              placeholder="Código"
              className={`${inputClass} py-2 uppercase`}
            />
            <button
              type="button"
              onClick={applyCoupon}
              className="rounded-xl border border-[#6E6353] px-4 text-sm text-[#6E6353] transition hover:bg-[#6E6353] hover:text-[#f4eee6]"
            >
              Aplicar
            </button>
          </div>
          {coupon && !couponError && (
            <p className="mt-1 text-xs text-[#6E6353]">✓ Cupón aplicado</p>
          )}
          {couponError && (
            <p className="mt-1 text-xs text-red-700">{couponError}</p>
          )}
          {coupon &&
            payment === "efectivo" &&
            STORE.cashDiscount > STORE.nextPurchaseCoupon.percent && (
              <p className="mt-1 text-xs text-[#2E2E2E]/60">
                Los descuentos no se suman: aplicamos el de efectivo, que es
                mayor.
              </p>
            )}
        </div>

        <dl className="space-y-1 border-t border-[#6E6353]/15 pt-4 text-sm">
          <div className="flex justify-between text-[#2E2E2E]/75">
            <dt>Subtotal</dt>
            <dd>{formatPrice(totals.subtotal)}</dd>
          </div>
          {totals.discountLabel && (
            <div className="flex justify-between text-[#2E2E2E]/75">
              <dt>{totals.discountLabel}</dt>
              <dd>−{formatPrice(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-[#2E2E2E]/75">
            <dt>Envío</dt>
            <dd>{totals.shippingLabel}</dd>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <dt className="text-[#2E2E2E]">Total</dt>
            <dd className="font-serif text-3xl text-[#2E2E2E]">
              {formatPrice(totals.total)}
            </dd>
          </div>
        </dl>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-sm tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-transparent hover:text-[#6E6353] disabled:cursor-wait disabled:opacity-60"
        >
          {sending ? "Enviando…" : "Confirmar pedido"}
        </button>
      </aside>
    </form>
  );
}
