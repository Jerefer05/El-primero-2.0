import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Finalizar compra | Tesoria",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <div className="mb-12 text-center">
        <p className="mb-4 text-xs tracking-[0.22em] text-[#2E2E2E]/70 uppercase">
          Último paso
        </p>
        <h1 className="title-soft font-serif text-4xl md:text-5xl">
          Finalizar compra
        </h1>
      </div>
      <CheckoutForm />
    </section>
  );
}
