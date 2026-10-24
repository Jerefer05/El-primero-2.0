"use client";

import Image from "next/image";
import { formatPrice } from "@/data/products";
import { STORE, whatsappLink } from "@/data/config";
import { PAYMENT_LABELS, SHIPPING_LABELS, type Order } from "@/lib/order";

export default function OrderReceipt({ order }: { order: Order }) {
  const { customer, totals } = order;
  const date = new Date(order.createdAt).toLocaleString("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const hasTransferData = STORE.transfer.alias || STORE.transfer.cbu;

  const paymentMessage = [
    `¡Hola ${STORE.name}! Hice el pedido ${order.number} por ${formatPrice(totals.total)}.`,
    order.payment === "transferencia"
      ? "Te mando el comprobante de la transferencia."
      : "Quiero coordinar el pago en efectivo y la entrega.",
  ].join(" ");

  return (
    <div className="receipt mx-auto max-w-2xl">
      <div className="mb-8 text-center print:hidden">
        <p className="mb-3 text-xs tracking-[0.22em] text-[#2E2E2E]/70 uppercase">
          ¡Gracias por tu compra!
        </p>
        <h1 className="title-soft font-serif text-4xl md:text-5xl">
          Pedido recibido
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#2E2E2E]/75">
          Ya le avisamos a {STORE.name}. Guardá este comprobante: te vamos a
          escribir por WhatsApp cuando tu pedido salga.
        </p>
      </div>

      <article className="rounded-3xl border border-white/50 bg-white/70 p-6 shadow-whisper backdrop-blur-sm sm:p-10 print:border-0 print:bg-white print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#6E6353]/15 pb-6">
          <div>
            <p className="font-serif text-3xl text-[#6E6353]">{STORE.name}</p>
            <p className="mt-1 text-xs tracking-[0.16em] text-[#8A887E] uppercase">
              Comprobante de pedido
            </p>
          </div>
          <div className="text-sm sm:text-right">
            <p className="font-semibold text-[#2E2E2E]">N.º {order.number}</p>
            <p className="text-[#2E2E2E]/70">{date}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-[#6E6353]/15 py-6 text-sm sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-xs tracking-[0.16em] text-[#8A887E] uppercase">
              Cliente
            </h2>
            <p className="text-[#2E2E2E]">{customer.name}</p>
            <p className="text-[#2E2E2E]/75">{customer.phone}</p>
            <p className="break-all text-[#2E2E2E]/75">{customer.email}</p>
          </div>
          <div>
            <h2 className="mb-2 text-xs tracking-[0.16em] text-[#8A887E] uppercase">
              Entrega y pago
            </h2>
            <p className="text-[#2E2E2E]">{SHIPPING_LABELS[order.shipping]}</p>
            {order.shipping === "envio" && (
              <p className="text-[#2E2E2E]/75">
                {customer.address}, {customer.city}
              </p>
            )}
            <p className="mt-1 text-[#2E2E2E]/75">
              {PAYMENT_LABELS[order.payment]}
            </p>
          </div>
          {customer.notes && (
            <div className="sm:col-span-2">
              <h2 className="mb-2 text-xs tracking-[0.16em] text-[#8A887E] uppercase">
                Nota
              </h2>
              <p className="text-[#2E2E2E]/75">{customer.notes}</p>
            </div>
          )}
        </section>

        <section className="space-y-4 border-b border-[#6E6353]/15 py-6">
          {order.lines.map((line) => (
            <div key={line.id} className="flex gap-4">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[#d7cbbe]">
                <Image
                  src={line.image}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-serif text-lg text-[#6E6353]">
                    {line.quantity} × {line.name}
                  </p>
                  <p className="shrink-0 text-sm text-[#2E2E2E]">
                    {formatPrice(line.price * line.quantity)}
                  </p>
                </div>
                <p className="text-xs text-[#2E2E2E]/60">
                  {formatPrice(line.price)} c/u
                </p>
                {line.features.length > 0 && (
                  <ul className="mt-1 text-xs text-[#2E2E2E]/75">
                    {line.features.map((feature) => (
                      <li key={feature.label}>
                        {feature.label}: {feature.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-1 py-6 text-sm">
          <div className="flex justify-between text-[#2E2E2E]/75">
            <span>Subtotal</span>
            <span>{formatPrice(totals.subtotal)}</span>
          </div>
          {totals.discountLabel && (
            <div className="flex justify-between text-[#2E2E2E]/75">
              <span>{totals.discountLabel}</span>
              <span>−{formatPrice(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[#2E2E2E]/75">
            <span>Envío</span>
            <span>{totals.shippingLabel}</span>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <span className="text-[#2E2E2E]">Total</span>
            <span className="font-serif text-3xl text-[#2E2E2E]">
              {formatPrice(totals.total)}
            </span>
          </div>
        </section>

        {order.payment === "transferencia" && (
          <section className="rounded-2xl bg-[#eaf0fa] p-5 text-sm">
            <h2 className="mb-2 font-serif text-lg text-[#6E6353]">
              Datos para transferir
            </h2>
            {hasTransferData ? (
              <dl className="space-y-1 text-[#2E2E2E]">
                {STORE.transfer.alias && (
                  <div>
                    <dt className="inline text-[#2E2E2E]/60">Alias: </dt>
                    <dd className="inline font-semibold">
                      {STORE.transfer.alias}
                    </dd>
                  </div>
                )}
                {STORE.transfer.cbu && (
                  <div>
                    <dt className="inline text-[#2E2E2E]/60">CBU/CVU: </dt>
                    <dd className="inline font-semibold break-all">
                      {STORE.transfer.cbu}
                    </dd>
                  </div>
                )}
                {STORE.transfer.holder && (
                  <div>
                    <dt className="inline text-[#2E2E2E]/60">Titular: </dt>
                    <dd className="inline">{STORE.transfer.holder}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-[#2E2E2E]/75">
                Te pasamos el alias por WhatsApp.
              </p>
            )}
            <p className="mt-3 text-xs text-[#2E2E2E]/70">
              Transferí {formatPrice(totals.total)} y mandanos el comprobante
              por WhatsApp con tu número de pedido.
            </p>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-dashed border-[#6E6353]/50 p-5 text-center">
          <p className="text-xs tracking-[0.16em] text-[#8A887E] uppercase">
            Regalo para tu próxima compra
          </p>
          <p className="mt-2 font-serif text-3xl tracking-widest text-[#6E6353]">
            {order.nextCoupon.code}
          </p>
          <p className="mt-1 text-sm text-[#2E2E2E]/75">
            {Math.round(order.nextCoupon.percent * 100)}% OFF ingresando este
            código al finalizar tu compra.
          </p>
        </section>
      </article>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row print:hidden">
        <a
          href={whatsappLink(paymentMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-full border border-[#6E6353] bg-[#6E6353] px-6 py-3 text-center text-sm tracking-[0.16em] text-[#f4eee6] uppercase transition hover:bg-transparent hover:text-[#6E6353]"
        >
          {order.payment === "transferencia"
            ? "Enviar comprobante de pago"
            : "Coordinar por WhatsApp"}
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 rounded-full border border-[#6E6353] px-6 py-3 text-sm tracking-[0.16em] text-[#6E6353] uppercase transition hover:bg-[#6E6353] hover:text-[#f4eee6]"
        >
          Descargar PDF
        </button>
      </div>
    </div>
  );
}
