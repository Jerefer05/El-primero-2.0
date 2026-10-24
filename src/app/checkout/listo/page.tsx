import type { Metadata } from "next";
import LastOrderReceipt from "@/components/LastOrderReceipt";

export const metadata: Metadata = {
  title: "Pedido recibido | Tesoria",
  robots: { index: false },
};

export default function OrderDonePage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24 print:p-0">
      <LastOrderReceipt />
    </section>
  );
}
